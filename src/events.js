/**
 * This file proposes a supplementary layer over the builtins addEventListener
 * and removeEventListener functions.
 *
 * It provides two functions:
 *   - addKeyEventListener
 *   - removeKeyEventListener
 *
 * Which are like respectively the addEventListener and removeEventListener
 * functions with some differences:
 *
 *   - Only works for 'keydown' and 'keyup' events.
 *
 *   - The events will be filtered for only the key available in this webapp's
 *     key map (@see config).
 *
 *   - The callback will have as argument an object with only two keys:
 *       - keyCode: the keyCode of the key pushed. Should be unique.
 *       - keyName: the name of the key pushed, as defined in the key map.
 *
 * Please note that this file perform an addEventListener and a
 * removeEventListener when parsed and do a preventDefault for the keys defined
 * in the key map, this is to avoid those keys (like F5) to have a non-wanted
 * behavior on the browser.
 */

import isSet from './misc/isSet.js';
import config from './config.js';

/**
 * Array containing every key pushed.
 * Used by addKeyPushedToArray / removeKeyPushedFromArray / isKeyPushed.
 * @type Array
 */
const KEYCODES_PUSHED = [];

/**
 * Add keyCode to the KEYCODES_PUSHED array.
 *
 * Used to be able to know if the key is currently pushed through the
 * isKeyPushed function.
 * @param {Number} keyCode
 */
const addKeyPushedToArray = keyCode => {
  KEYCODES_PUSHED.push(keyCode);
};

/**
 * Remove keyCode from the KEYCODES_PUSHED array.
 *
 * Used to be able to know if the key is currently pushed through the
 * isKeyPushed function.
 * @param {Number} keyCode
 */
const removeKeyPushedFromArray = keyCode => {
  for (let i = KEYCODES_PUSHED.length - 1; i >= 0; i--) {
    if (KEYCODES_PUSHED[i] === keyCode) {
      KEYCODES_PUSHED.splice(i, 1);
      return;
    }
  }
};

/**
 * Register every 'keydown' callbacks added through addKeyEventListener.
 *
 * Used to keep track of it as a addEventListener is only done one time
 * in our application and we never perform any removeEventListener.
 * @type Array.<Function>
 */
const keyDownCallbacks = [];

/**
 * Register every 'keyup' callbacks added through addKeyEventListener.
 *
 * Used to keep track of it as a addEventListener is only done one time
 * in our application and we never perform any removeEventListener.
 * @type Array.<Function>
 */
const keyUpCallbacks = [];

/**
 * Trigger every callbacks registered for the 'keydown' events with the
 * right arguments.
 *
 * @param {String} keyName
 * @param {Number} keyCode
 */
const triggerKeyDownEvent = (keyName, keyCode) => {
  const arg = { keyName, keyCode };
  keyDownCallbacks.forEach((c) => c(arg));
};

/**
 * Trigger every callbacks registered for the 'keyup' events with the
 * right arguments.
 *
 * @param {String} keyName
 * @param {Number} keyCode
 */
const triggerKeyUpEvent = (keyName, keyCode) => {
  const arg = { keyName, keyCode };
  keyUpCallbacks.forEach((c) => c(arg));
};

/**
 * Trigger callbacks defined for the keyup event.
 * @param {Number} keyCode
 * @param {string} keyName
 */
const triggerKeyupCallbacks = (keyCode, keyName) => {
  // call every callbacks related to this key
  triggerKeyUpEvent(keyName, keyCode);
};

/**
 * Callback for the keydown event.
 * @param {Object} evt
 */
const onKeyDown = (evt) => {
  let { keyCode } = evt;
  if (keyCode == null) {
    keyCode = evt.which;
  }

  const keyName = config.KEY_MAP[keyCode];

  // if this key is not defined in the keyMap, don't do anything
  if (!isSet(keyName)) {
    return;
  }

  // avoid keys, like 'Back', to be catched by the browser
  evt.preventDefault();

  // if the key is already pushed, quit, we have our own mean for consecutive
  // keydowns (@see CONSECUTIVE_KEYDOWNS_OBJECT)
  if (isKeyPushed(keyCode)) {
    return;
  }

  // Consider the key as pushed from there
  addKeyPushedToArray(keyCode);

  // start sending keydown events
  triggerKeyDownEvent(keyCode, keyName);
};

/**
 * Callback for the keyup event.
 * @param {Object} evt
 */
const onKeyUp = (evt) => {
  let { keyCode } = evt;
  if (keyCode == null) {
    keyCode = evt.which;
  }

  const keyName = config.KEY_MAP[keyCode];

  // if this key is not defined in the keyMap, don't do anything
  if (!isSet(keyName)) {
    return;
  }

  // avoid keys, like 'Back', to be catched by the browser
  evt.preventDefault();

  // Consider the key as released from there.
  removeKeyPushedFromArray(keyCode);

  // stop sending keydown events
  stopTriggeringKeydownCallbacks(keyCode);

  // send keyup event
  triggerKeyupCallbacks(keyCode, keyName);
};

/**
 * Returns true if the key from the given keyCode is considered pushed.
 *
 * Note: The keyCode has to be added / removed through the addKeyPushedToArray /
 * removeKeyPushedFromArray functions for this to work.
 * @returns {Boolean}
 */
const isKeyPushed = keyCode => KEYCODES_PUSHED.includes(keyCode);

/**
 * Add new callback for a 'keydown' event on a webapp key
 * (if not already added).
 * @param {Function} - callback
 */
const addKeyDownListener = (callback) => {
  if (!keyDownCallbacks.includes(callback)) {
    keyDownCallbacks.push(callback);
  }
};

/**
 * Add new callback for a 'keyup' event on a webapp key
 * (if not already added).
 * @param {Function} - callback
 */
const addKeyUpListener = (callback) => {
  if (!keyUpCallbacks.includes(callback)) {
    keyUpCallbacks.push(callback);
  }
};

/**
 * Add new callback for the 'keydown' or the 'keyup' event
 * (if not already added).
 * @param {String} event - 'keydown' or 'keyup'
 * @param {Function} callback
 */
const addKeyEventListener = (event, callback) => {
  switch (event) {
    case 'keyup':
      addKeyUpListener(callback);
      break;
    case 'keydown':
      addKeyDownListener(callback);
  }
};

/**
 * Remove callback for a 'keydown' event on a webapp key.
 * @param {Function} - callback
 */
const removeKeyDownListener = (callback) => {
  for (let i = keyDownCallbacks.length - 1; i >= 0; i--) {
    if (keyDownCallbacks[i] === callback) {
      keyDownCallbacks.splice(i, 1);
      return;
    }
  }
};

/**
 * Remove callback for a 'keyup' event on a webapp key.
 * @param {Function} - callback
 */
const removeKeyUpListener = (callback) => {
  for (let i = keyUpCallbacks.length - 1; i >= 0; i--) {
    if (keyUpCallbacks[i] === callback) {
      keyUpCallbacks.splice(i, 1);
      return;
    }
  }
};

/**
 * Remove callback for a 'keydown' or a 'keyup' event on a webapp key.
 * @param {String} event - 'keydown' or 'keyup'
 * @param {Function} - callback
 */
const removeKeyEventListener = (event, callback) => {
  switch (event) {
    case 'keyup':
      removeKeyUpListener(callback);
      break;
    case 'keydown':
      removeKeyDownListener(callback);
  }
};

// add event listeners
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

export {
  addKeyEventListener,
  removeKeyEventListener,
  KEYCODES_PUSHED
};

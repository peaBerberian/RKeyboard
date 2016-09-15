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
 *   - The delay between successive keydown events is controlled (@see config)
 *
 *   - The events will be filtered for only the key available in this webapp's
 *     key map (@see config).
 *
 *   - The callback will have as argument an object with only two keys:
 *       - keyCode: the keyCode of the key pushed.
 *       - keyName: the name of the key pushed, as defined in the key map.
 *
 * Please note that this file perform an addEventListener and a
 * removeEventListener when parsed and do a preventDefault for the keys defined
 * in the key map, this is to avoid those keys (like F5) to have a non-wanted
 * behavior on the browser.
 */

import { isSet } from '../../misc/utils.js';
import config from './config.js';

/*
 * Specific object to manage consecutive keydown events for the same keyCode as
 * long as it has not been released.
 *
 * This is useful only for some cornercases, like chaining multiple components
 * without releasing a key (for example, navigating through several components
 * by maintening the 'Down' key).
 *
 * See this like a JavaScript implementation of the normally lower-level code
 * that manages multiple consecutive keydown events when you maintain the same
 * key.
 *
 * --
 *
 * The keys of this object are the keycodes of the keys pushed.
 * The values are intervals at which we re-send a keydown-like event.
 * I choose to control directly this part because our devices all have different
 * intervals for consecutive keydown.
 *
 * --
 *
 * Basically, if you perform a remote.listen call on a 'Enter' key push event,
 * for example, this new call will receive a new push order after this interval
 * if the key has not been released since (Note: for the same remote.listen,
 * multiple consecutive keydowns are filtered, on purpose).
 *
 * --
 *
 * @type Object
 */
const CONSECUTIVE_KEYDOWNS_OBJECT = {};

/**
 * Array containing every key pushed.
 * Used by addKeyPushed / removeKeyPushed / isKeyPushed.
 * @type Array
 */
const KEYS_PUSHED = [];

/**
 * Add keyCode to the KEYS_PUSHED array.
 *
 * Used to be able to know if the key is currently pushed through the
 * isKeyPushed function.
 * @param {Number} keyCode
 */
const addKeyPushed = keyCode => {
  KEYS_PUSHED.push(keyCode);
};

/**
 * Remove keyCode from the KEYS_PUSHED array.
 *
 * Used to be able to know if the key is currently pushed through the
 * isKeyPushed function.
 * @param {Number} keyCode
 */
const removeKeyPushed = keyCode => {
  for (let i = KEYS_PUSHED.length - 1; i >= 0; i--) {
    if (KEYS_PUSHED[i] === keyCode) {
      KEYS_PUSHED.splice(i, 1);
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
 * Start triggering callbacks defined for the keydown events.
 * Continue triggering them at a CONSECUTIVE_KEYDOWNS_INTERVAL interval.
 * @param {Number} keyCode
 * @param {string} keyName
 */
const startTriggeringKeydownCallbacks = (keyCode, keyName) => {
  const { CONSECUTIVE_KEYDOWNS_INTERVAL } = config;

  stopTriggeringKeydownCallbacks(keyCode);

  // call every callbacks related to this key
  triggerKeyDownEvent(keyName, keyCode);

  if (CONSECUTIVE_KEYDOWNS_INTERVAL) {
    // and do the same every CONSECUTIVE_KEYDOWNS_INTERVAL
    CONSECUTIVE_KEYDOWNS_OBJECT[keyCode] = setInterval(() => {
      triggerKeyDownEvent(keyName, keyCode);
    }, CONSECUTIVE_KEYDOWNS_INTERVAL);
  }
};

/**
 * Stop triggering callbacks defined for the keydown events at a
 * CONSECUTIVE_KEYDOWNS_INTERVAL interval.
 * @param {Number} keyCode
 */
const stopTriggeringKeydownCallbacks = (keyCode) => {
  const oldInterval = CONSECUTIVE_KEYDOWNS_OBJECT[keyCode];
  if (oldInterval) {
    clearInterval(oldInterval);
    delete CONSECUTIVE_KEYDOWNS_OBJECT[keyCode];
  }
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
  const { keyCode } = evt;

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
  addKeyPushed(keyCode);

  // start sending keydown events
  startTriggeringKeydownCallbacks(keyCode, keyName);
};

/**
 * Callback for the keyup event.
 * @param {Object} evt
 */
const onKeyUp = (evt) => {
  const { keyCode } = evt;

  const keyName = config.KEY_MAP[keyCode];

  // if this key is not defined in the keyMap, don't do anything
  if (!isSet(keyName)) {
    return;
  }

  // avoid keys, like 'Back', to be catched by the browser
  evt.preventDefault();

  // Consider the key as released from there.
  removeKeyPushed(keyCode);

  // stop sending keydown events
  stopTriggeringKeydownCallbacks(keyCode);

  // send keyup event
  triggerKeyupCallbacks(keyCode, keyName);
};

/**
 * Returns true if the key from the given keyCode is considered pushed.
 *
 * Note: The keyCode has to be added / removed through the addKeyPushed /
 * removeKeyPushed functions for this to work.
 * @returns {Boolean}
 */
const isKeyPushed = keyCode => KEYS_PUSHED.includes(keyCode);

// /**
//  * Returns true if the key for the given keyName is considered pushed.
//  *
//  * Note: The keyCode has to be added / removed through the addKeyPushed /
//  * removeKeyPushed functions for this to work.
//  * @returns {Boolean}
//  */
// const isKeyPushedFromKeyName = keyName => {
//   const entries = Object.entries(config.KEY_MAP);
//   for (let i = entries.length - 1; i >= 0; i--) {
//     if (entries[i][1] === keyName && isKeyPushed(entries[i][0])) {
//       return true;
//     }
//   }
//   return false;
// };

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
      break;
    default:
    // throw new Error('This is not a key event!');
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
      break;
    default:
      // throw new Error('This is not a key event!');
  }
};

// add event listeners
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

export {
  addKeyEventListener,
  removeKeyEventListener
};

/**
 * This file proposes a supplementary layer over the builtins addEventListener
 * and removeEventListener functions.
 *
 * It provides two functions:
 *   - on
 *   - off
 *
 * Which wrap respectively the addEventListener and removeEventListener
 * functions with some differences:
 *
 *   - Only works for 'keydown' and 'keyup' events.
 *
 *   - Only emit the first keydown when the key is held (not released).
 *
 *   - You must define the keyCodes listened to, and you are only notified for
 *     the events for those keys.
 *
 *   - Multiple on call for the same callback will bind only the last one
 *     declared.
 *
 *   - The callback will have as argument the keyCode of the key pushed.
 *
 * Please note that this file perform three addEventListener when parsed.
 */

/**
 * Array containing every key pushed.
 * Used by addKeyPushedToArray / removeKeyPushedFromArray / isKeyPushed.
 * Used to avoid sending two times in a row a keydown event for the same key.
 * @type Array.<Number>
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
 * Register every 'keydown' callbacks added through addKeyEventListener, as well
 * as their registered keyCodes.
 *
 * Used to keep track of it as a addEventListener is only done one time
 * in our application and we never perform any removeEventListener.
 * @type Array.<Function>
 */
const keyDownCallbacks = [];

/**
 * Register every 'keyup' callbacks added through addKeyEventListener, as well
 * as their registered keyCodes.
 *
 * Used to keep track of it as a addEventListener is only done one time
 * in our application and we never perform any removeEventListener.
 * @type Array.<Function>
 */
const keyUpCallbacks = [];

const listen = (keyCodes, { preventDefault } = {}) => {
  // keep track of which callbacks were added through this listen call
  const localKeyDownCallbacks = [];
  const localKeyUpCallbacks = [];

  let isClosed = false;

  /**
   * Add new callback for a 'keydown' event on a webapp key
   * If the same callback was already registered, replace it.
   * @param {Array.<Number>} keyCodes
   * @param {Function} - callback
   */
  const addKeyDownListener = (callback) => {
    // if we already registered the same callback here, return
    for (let i = localKeyDownCallbacks.length - 1; i >= 0; i--) {
      if (localKeyDownCallbacks[i].callback === callback) {
        return;
      }
    }
    const localKeyDownCallback = { keyCodes, callback };
    localKeyDownCallbacks.push(localKeyDownCallback);
    keyDownCallbacks.push(localKeyDownCallback);
  };

  /**
   * Add new callback for a 'keyup' event on a webapp key.
   * If the same callback was already registered, replace it.
   * @param {Array.<Number>} keyCodes
   * @param {Function} - callback
   */
  const addKeyUpListener = (callback) => {
    // if we already registered the same callback here, return
    for (let i = localKeyUpCallbacks.length - 1; i >= 0; i--) {
      if (localKeyUpCallbacks[i].callback === callback) {
        return;
      }
    }
    const localKeyUpCallback = { keyCodes, callback };
    localKeyUpCallbacks.push(localKeyUpCallback);
    keyUpCallbacks.push(localKeyUpCallback);
  };

  /**
   * Remove callback for a 'keydown' event on a webapp key.
   * @param {Function} - callback
   */
  const removeKeyDownListener = (callback) => {
    for (let i = localKeyDownCallbacks.length - 1; i >= 0; i--) {
      if (localKeyDownCallbacks[i].callback === callback) {
        const indexOf =
          keyDownCallbacks.indexOf(localKeyDownCallbacks[i]);

        localKeyDownCallbacks.splice(i, 1);
        keyDownCallbacks.splice(indexOf, 1);
        return;
      }
    }
  };

  /**
   * Remove callback for a 'keyup' event on a webapp key.
   * @param {Function} - callback
   */
  const removeKeyUpListener = (callback) => {
    for (let i = localKeyUpCallbacks.length - 1; i >= 0; i--) {
      if (localKeyUpCallbacks[i].callback === callback) {
        const indexOf =
          keyUpCallbacks.indexOf(localKeyUpCallbacks[i]);

        localKeyUpCallbacks.splice(i, 1);
        keyUpCallbacks.splice(indexOf, 1);
        return;
      }
    }
  };

  const removeAllListeners = () => {
    for (let i = localKeyDownCallbacks.length - 1; i >= 0; i--) {
      const indexOf =
        keyDownCallbacks.indexOf(localKeyDownCallbacks[i]);
      localKeyDownCallbacks.splice(i, 1);
      keyDownCallbacks.splice(indexOf, 1);
    }
    for (let i = localKeyUpCallbacks.length - 1; i >= 0; i--) {
      const indexOf =
        keyUpCallbacks.indexOf(localKeyUpCallbacks[i]);
      localKeyUpCallbacks.splice(i, 1);
      keyUpCallbacks.splice(indexOf, 1);
    }
  };

  const preventDefaultCallback = evt => {
    if (keyCodes.includes(getKeyCode(evt))) {
      evt.preventDefault();
    }
  };
  if (preventDefault) {
    document.addEventListener('keydown', preventDefaultCallback);
    document.addEventListener('keyup', preventDefaultCallback);
  }

  return {
    on(event, callback) {
      if (isClosed && preventDefault) {
        document.addEventListener('keydown', preventDefaultCallback);
        document.addEventListener('keyup', preventDefaultCallback);
      }
      switch (event) {
        case 'keydown':
          addKeyDownListener(callback);
          break;

        case 'keyup':
          addKeyUpListener(callback);
          break;
      }
    },

    off(event, callback) {
      switch (event) {
        case 'keydown':
          removeKeyDownListener(callback);
          break;
        case 'keyup':
          removeKeyUpListener(callback);
      }
    },

    close() {
      removeAllListeners();
      document.removeEventListener('keydown', preventDefaultCallback);
      document.removeEventListener('keyup', preventDefaultCallback);
      isClosed = true;
    }
  };
};

/**
 * Trigger every callbacks registered for the 'keydown' events with the
 * right arguments.
 *
 * @param {Number} keyCode
 */
const triggerKeyDownEvent = (keyCode) => {
  keyDownCallbacks.forEach((kdc) => {
    if (kdc.keyCodes.includes(keyCode)) {
      kdc.callback(keyCode);
    }
  });
};

/**
 * Trigger every callbacks registered for the 'keyup' events with the
 * right arguments.
 *
 * @param {Number} keyCode
 */
const triggerKeyUpEvent = (keyCode) => {
  keyUpCallbacks.forEach((kuc) => {
    if (kuc.keyCodes.includes(keyCode)) {
      kuc.callback(keyCode);
    }
  });
};

const getKeyCode = (evt) => {
  const { keyCode } = evt;
  return keyCode != null ?
    keyCode : evt.which;
};

/**
 * Callback for the keydown event.
 * @param {Object} evt
 */
const onKeyDown = (evt) => {
  const keyCode = getKeyCode(evt);

  // if the key is already pushed, quit, we have our own mean for consecutive
  // keydowns (@see CONSECUTIVE_KEYDOWNS_OBJECT)
  if (isKeyPushed(keyCode)) {
    return;
  }

  // Consider the key as pushed from there
  addKeyPushedToArray(keyCode);

  // start sending keydown events
  triggerKeyDownEvent(keyCode);
};

/**
 * Callback for the keyup event.
 * @param {Object} evt
 */
const onKeyUp = (evt) => {
  const keyCode = getKeyCode(evt);

  // Consider the key as released from there.
  removeKeyPushedFromArray(keyCode);

  // send keyup event
  triggerKeyUpEvent(keyCode);
};

/**
 * Returns true if the key from the given keyCode is considered pushed.
 *
 * Note: The keyCode has to be added / removed through the addKeyPushedToArray /
 * removeKeyPushedFromArray functions for this to work.
 * @returns {Boolean}
 */
const isKeyPushed = keyCode => KEYCODES_PUSHED.includes(keyCode);

// add event listeners

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// when not focusing the current window, release every keys to avoid having an
// infinite keydown.
// /!\ seems to not working well when changing tabs on chrome, sadly
window.addEventListener('blur', () => {
  // ugly but does the job
  KEYCODES_PUSHED.forEach(keyCode =>
    onKeyUp({
      keyCode,
      preventDefault: () => {}
    })
  );
});

export { KEYCODES_PUSHED };
export default listen;

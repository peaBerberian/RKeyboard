import isSet from './misc/isSet.js';
import uniq from './misc/uniq.js';

import KeyCatcher from './key_catcher.js';
import config from './config.js';

/**
 * Defines three types of events:
 *
 *   - __push__: The key has just been pushed.
 *
 *   - __release__: The key has just been released.
 *
 *   - __press__: The key is pressed (between a 'push' and a 'release').
 *       This event is sent at intervals depending on params you gave to
 *       this listener.
 */
const EVENT_NAMES = {
  KEY_DOWN: 'push',
  KEY_UP: 'release',
  KEY_PRESS: 'press'
};

/**
 * Keyboard factory.
 *
 * Manage complex propagation rules (propagating the same key's events to
 * multiple listening elements).
 *
 * @example
 * ```js
 * import createKeyboard from './keyboard.js';
 *
 * // creating a keyboard with its own propagation rules
 * const keyboard = createKeyboard();
 *
 * // listen to the 'Up' key events and trigger a callback as it is pushed /
 * // released
 * const upKey = keyboard('Up', (e) => {
 *    // either 'push' or 'release'
 *    console.log(e.event);
 *
 *    // 'Up' as it is the only key listened to here
 *    console.log(e.keyName);
 *
 *    // Time the key has been pushed in ms (0 for 'push' event)
 *    console.log(e.timepress);
 *
 *    // ...
 * });
 *
 * // Doing the same for multiple keys ('Up' OR 'Enter')
 * const upAndEnter = keyboard(['Up', 'Enter'], () => {
 *   // ...
 * });
 *
 * // Doing the same for all keys (we simply ignore the first argument)
 * const allKeys = keyboard((e) => {
 *   // ...
 * });
 *
 * // add custom key press rules for the 'Up' key
 * const withPress = keyboard('Up', {
 *     press: {
 *       after: 1000,
 *       interval: 2000
 *     }
 *   },
 *   (e) => {
 *     // either 'push', 'release' or 'press'
 *     console.log(e.event);
 *
 *     // ...
 *   });
 *
 * // what if we want press rules for ALL keys?
 * // We again ignore the first argument.
 * const allKeysWithPress = keyboard({
 *     press: {
 *       after: 1000,
 *       interval: 2000
 *     }
 *   },
 *   () => {
 *   });
 *
 * // -- start and stop listening to the key Up --
 *
 * // first listen to the key and store the returned object
 * const myKey = keyboard('Up');
 *
 * // executing it free the event listener
 * myKey();
 * ```
 *
 * @returns {Function} Key handling function.
 * This function only rules are:
 *   - it can take 3 arguments which can only be written in this order:
 *      1. the key(s) as a string or as an array of strings
 *      2. the options, as an object
 *      3. the callback, as a function
 *    - All of them can be ignored, undefined or null with the following
 *      effect on each one:
 *        1. all keys defined in the key map are catched
 *        2. no option is set
 *        3. no callback is set
 */
export default () => {
  // Create new propagation layer from the KeyCatcher
  const kc = KeyCatcher();

  return (...args) => {
    // get arguments
    const {
      keys = uniq(Object.values(config.KEY_MAP)),
      options = {},
      callbackNext = () => {}
    } = _processArguments(...args);

    // get after and interval options
    const {
      after: pressAfter,
      interval: pressInterval,
      propagate,
      combine: shouldCombineKeys = config.DEFAULT_COMBINE_VALUE
    } = _processOptions(options);

    // object used to know which key is pushed and when
    // for each keycode
    const keysObj = Object.keys(config.KEY_MAP)
      .reduce((vals, key) => {
        vals[key] = {
          // name of the key
          keyName: config.KEY_MAP[key],

          // true if currently pushed
          isPushed: false,

          // timestamp of push start (null if not currently pushed)
          pushStart: null,

          // store a setInterval's return for press events
          interval: null,

          // store a setTimeout's return for press events
          timeout: null
        };

        return vals;
      }, {});

    /**
     * Clear current timeout and/or interval for a specific key object.
     * @param {Object} keyObj
     * @param {Number|null} keyObj.timeout
     * @param {Number|null} keyObj.interval
     */
    const clearKeyTimeouts = ({ timeout, interval }) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      if (interval) {
        clearInterval(interval);
      }
    };

    /**
     * Send 'push' event for the given key object (property from the keysObj
     * object).
     * @param {Object} keyObj
     */
    const sendPushEvent = ({ keyName }) => {
      callbackNext({
        keyName,
        event: EVENT_NAMES.KEY_DOWN,
        timepress: 0
      });
    };

    /**
     * Send 'press' event for the given key object (property from the keysObj
     * object).
     * @param {Object} keyObj
     */
    const sendPressEvent = ({ keyName, pushStart }) => {
      callbackNext({
        keyName,
        event: EVENT_NAMES.KEY_PRESS,
        timepress: pushStart ? (Date.now() - pushStart) : 0
      });
    };

    /**
     * Send 'release' event for the given key object (property from the keysObj
     * object).
     * @param {Object} keyObj
     */
    const sendReleaseEvent = ({ keyName, pushStart }) => {
      callbackNext({
        keyName,
        event: EVENT_NAMES.KEY_UP,
        timepress: pushStart ? (Date.now() - pushStart) : 0
      });
    };

    /**
     * Generic callback for new key events.
     * Given to the registerCatcher function.
     *
     * If the key is listened to, dispatch the event to:
     *   - onDownEvent if a 'keydown' event has been received
     *   - onUpEvent if a 'keyup' event has been received
     * with the right key object (element from the keysObj array).
     *
     * @see registerCatcher
     * @see onDownEvent
     * @see onUpEvent
     * @param {Object} evt
     * @param {string} evt.type - 'keyup' or 'keydown'
     * @param {string} evt.keyName
     * @param {Number} evt.keyCode
     */
    const onEvent = ({ type, keyName, keyCode }) => {

      // if keyName is not listened to, abort
      if (!keys.includes(keyName)) {
        return;
      }

      const keyObj = keysObj[keyCode];

      switch (type) {
        case 'keydown':
          onDownEvent(keyObj);
          break;
        case 'keyup':
          onUpEvent(keyObj);
          break;
      }
    };

    /**
     * Callback called when a 'keydown' event was received for a particular
     * key object (keyObj param).
     *
     * If the key is not already pushed:
     *   1. Begin timeout and/or interval for press events if specified.
     *   2. Set right data on the key object
     *   3. Trigger a push event for the key
     * @param {Object} keyObj - The key object
     */
    const onDownEvent = (keyObj) => {
      // if it is already pushed, abort
      if (keyObj.isPushed) {
        return;
      }

      // if we do not want to combine keys
      // clear press timeouts for every key already pressed.
      if (!shouldCombineKeys) {
        keysObj.forEach((k) => clearKeyTimeouts(k));
      }

      // start press timeout + interval
      if (isSet(pressAfter)) {

        keyObj.timeout = setTimeout(() => {
          sendPressEvent(keyObj);

          if (pressInterval) {
            keyObj.interval = setInterval(() => {
              sendPressEvent(keyObj);
            }, pressInterval);
          }
        }, pressAfter);
      }
 
      // set keyObj data
      keyObj.isPushed = true;
      keyObj.pushStart = Date.now();

      // send initial push event
      sendPushEvent(keyObj);
    };

    /**
     * Callback called when a 'keyup' event was received for a particular
     * key object (keyObj param).
     *
     * If the key is considered already pushed:
     *   1. clear timeout and/or interval for press events if specified.
     *   2. Trigger a release event for the key
     *   2. Set right data on the key object
     * @param {Object} keyObj - The key object
     */
    const onUpEvent = (keyObj) => {
      // if no push event has been received, don't send release events
      // (this can happen if the key was pushed while we were not listening)
      if (!keyObj.isPushed) {
        return;
      }

      clearKeyTimeouts(keyObj);

      sendReleaseEvent(keyObj);

      keyObj.isPushed = false;
      keyObj.pushStart = null;
    };

    kc.register(keys, propagate, onEvent);

    return () => {
      // clear timeout for every key
      for (const key of Object.keys(keysObj)) {
        clearKeyTimeouts(keysObj[key]);
      }

      // clear catchers
      kc.unregister(keys, onEvent);
    };
  };
};

/**
 * Retrieve arguments (keys + options + callback).
 * undefined if not defined/null/ignored.
 * @param {...*} [args]
 * @return {Object} obj
 * @returns {Array.<string>|undefined} obj.keys - Every key names listened to.
 * Groupings are browsed to only include real key names.
 * @returns {Object|undefined} obj.options
 * @returns {Function|undefined} obj.callbackNext
 */
const _processArguments = function(...args) {
  let keys; // key names
  let options;
  let callbackNext;

  /**
   * Browse Groupings to be sure only key names are returned.
   * @param {Array.<string>} names
   * @returns {Array.<string>}
   */
  const getKeysFromNames = (names) =>
    names.reduce((kns, name) => {
      if (Object.keys(config.GROUPINGS).includes(name)) {
        return kns.concat(config.GROUPINGS[name]);
      }
      kns.push(name);
      return kns;
    }, []);

  let argId = 0;
  let arg = args[argId];

  if (Array.isArray(arg)) {
    keys = getKeysFromNames(arg);
    argId++;
    arg = args[argId];
  } else if (typeof arg === 'string') {
    keys = getKeysFromNames([arg]);
    argId++;
    arg = args[argId];
  }

  if (typeof arg === 'object' && arg !== null) {
    options = arg;
    argId++;
    arg = args[argId];
  }

  if (typeof arg === 'function') {
    callbackNext = arg;
  }

  return {
    keys,
    options,
    callbackNext,
  };
};

/**
 * Retrieve press options from the options arguments.
 * @param {Object} options - options as returned by _processArguments.
 * @returns {Object} opts - options as returned by
 * @returns {Number} [opts.after] - Time (after a keydown event) after which
 * a key press is triggered. Without this param, no press is possible.;
 * @returns {Number} [opts.interval] - Interval (after 'after') on which the
 * press event is triggered. If not set, no press event interval is set.
 * @returns {Boolean} opts.propagate - wether the keyboard call is
 * propagated to the next one or not.
 */
const _processOptions = function(options) {
  let after, interval;
  const {
    propagate,
    combine
   } = options;

  if (isSet(options.press)) {
    if (typeof options.press.after === 'number') {
      after = options.press.after;
    }

    if (typeof options.press.interval === 'number') {
      interval = options.press.interval;
    }

    if (!isSet(after) && isSet(interval)) {
      after = interval;
    }
  }

  return {
    after,
    interval,
    propagate
  };
};

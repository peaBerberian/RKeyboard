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
 * You can create multiple keyboards, each of them will have their own
 * propagation rules.
 *
 * @example
 * import createKeyboard from './keyboard.js';
 *
 * // creating a keyboard
 * const keyboard = createKeyboard();
 *
 * // simple usecase -> doing something on the keys 'Up' and 'Down'
 * keyboard('Up', 'Down', (e) => {
 *    // either 'push' or 'release'
 *    console.log(e.event);
 *
 *    // 'Up' or 'Down' as they are the only keys listened to
 *    console.log(e.keyName);
 *
 *    // Time the key has been pushed in ms (0 for 'push' event)
 *    console.log(e.timepress);
 *
 *    // ...
 * });
 *
 * // listen to all key events
 * keyboard((e) => {
 *   // ...
 * });
 *
 * // listen to key press event on Up key configured with `after` and
 * // `interval` options
 * keyboard('Up', { press: { after: 1000, interval: 2000 }, (e) => {
 *    // either 'push', 'release' or 'press'
 *    console.log(e.event);
 *
 *   // ...
 * });
 *
 * // start and stop listening to the key Up
 * const stopListening = keyboard('Up');
 * stopListening();
 *
 * @returns {Function} Key handling function.
 *   Can take multiple arguments (see examples):
 *   - An optional n number of string(s) corresponding to the key names or key
 *     groups...
 *     If the first arguments are not keys, every key declared in the
 *     KEY_MAP will be considered.
 *
 *   - An optional object which corresponds to key options. Can have the
 *     following keys:
 *       - propagate {Boolean}: Optional propagate value. Equal to
 *         DEFAULT_PROPAGATE_VALUE by default.
 *       - press {Object}: Optional press settings.
 *
 *   - An optional function which corresponds to the callback called on key
 *     event.
 *     If not set, a noOp function will be used. You can still want that just
 *     to catch the keys (no propagation) without doing anything with it.
 *
 *   - A second optional function which corresponds to the callback called on
 *     event unsubscription.
 *     Can only be set if the precedent callback has also been set.
 *     If not set, a noOp function will be used.
 */
export default () => {
  // Create new propagation layer from the KeyCatcher
  const kc = KeyCatcher();

  return (...args) => {
    // get arguments
    const {
      keys,
      options = {},
      callbackNext = () => {},
      callbackClose = () => {}
    } = _processListenArguments(...args);

    // get after and interval options
    const {
      after: pressAfter,
      interval: pressInterval,
      propagate
    } = _processOptions(options);

    // object used to know which key is pushed and when
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
      callbackClose();

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
 * Retrieve arguments (keys + options).
 * @param {...*} [args]
 * @return {Object} obj
 * @returns {Array} obj.keys
 * @returns {Object|undefined} [obj.options]
 * @returns {Function|undefined} callbackNext
 * @returns {Function|undefined} callbackClose
 */
const _processListenArguments = function(...args) {
  let keys; // key names
  let options;
  let callbackNext;
  let callbackClose;

  let lastArgId = args.length - 1;

  if (typeof args[lastArgId] === 'function') {
    const cb1 = args[lastArgId];
    lastArgId--;
    const cb2 = typeof args[lastArgId] === 'function' && args[lastArgId];

    if (cb2) {
      lastArgId--;
      callbackNext = cb2;
      callbackClose = cb1;
    } else {
      callbackNext = cb1;
    }
  }

  if (typeof args[lastArgId] === 'object') {
    options = args[lastArgId];
    lastArgId --;
  }

  const getKeysFromNames = (names) =>
    names.reduce((kns, name) => {
      if (Object.keys(config.GROUPINGS).includes(name)) {
        return kns.concat(config.GROUPINGS[name]);
      }
      kns.push(name);
      return kns;
    }, []);

  if (lastArgId >= 0) {
    keys = getKeysFromNames(args.slice(0, lastArgId));
  } else {
    // else keys is every key in the keymap
    keys = uniq(Object.values(config.KEY_MAP));
  }

  return {
    keys,
    options,
    callbackNext,
    callbackClose
  };
};

/**
 * Retrieve press options from the options arguments.
 * @param {Object} options - options as returned by _processListenArguments.
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
  const propagate = options.propagate;

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

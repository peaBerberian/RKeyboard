/**
 * This file defines the Remote class which allows anyone to listen to specific
 * keys in an rxjs observable style.
 */

import { Observable } from 'rxjs/Observable';

import isSet from './misc/isSet.js';
import uniq from './misc/uniq.js';

import KeyEventListener from './key_event_listener.js';
import config from './config.js';

const keyEventListenerSymbol = Symbol();

/**
 * Class handling remote events.
 *
 * This class provides multiple methods to easily manage the remote keys.
 *
 * It defines three types of events:
 *
 *   - __push__: The key has just been pushed.
 *
 *   - __release__: The key has just been released.
 *
 *   - __press__: The key is pressed (between a 'push' and a 'release').
 *       This event is sent at intervals depending on params you gave to
 *       this listener.
 *
 * And manage complex propagation rules (propagating the same key's events to
 * multiple listening elements).
 *
 * You can instantiate multiple remote, each of them will have their own
 * propagation rules.
 *
 * @example
 *
 * const remote = new Remote();
 *
 * // simple usecase -> doing something on the keys 'Up' and 'Down'
 * remote.listen('Up', 'Down').subscribe((e) => {
 *    // either 'push', 'release' or 'press'
 *    console.log(e.event);
 *
 *    // 'Up' or 'Down' as they are the only keys listened to
 *    console.log(e.keyName);
 *
 *    // Time the key has been pushed in ms (0 for 'push' event)
 *    console.log(e.timepress);
 *
 *    doSomething();
 * });
 *
 * // listen to all key events
 * remote.listen().subscribe((e) => {
 *  …
 * });
 *
 * // listen to key press event on Up key configured with `after` and `interval` options
 * remote.listen('Up', { press: { after: 1000, interval: 2000 }}).subscribe((e) => {
 *  …
 * });
 *
 * @class
 */
export default class Remote {
  constructor() {
    this[keyEventListenerSymbol] = new KeyEventListener();
  }

/**
 * Event names used in the webapp by the Remote.
 * @static
 * @type Object
 */
  static EVENT_NAMES = {
    KEY_DOWN: 'push',
    KEY_UP: 'release',
    KEY_PRESS: 'press'
  };

  /**
   * Listen to key events.
   *
   * __Key press events can be configurable__, set options as last argument :
   *   - __after__: {number} the delay in ms before emit the first press event
   *   - __interval__: {number} the interval in ms between two press events
   *
   * @param {...string|Object} [args] List of key names to listen.
   * @return {Observable}
   */
  listen(...args) {
    // get arguments
    const {
      keys,
      options
    } = _processListenArguments(...args);

    // get after and interval options
    const {
      after: pressAfter,
      interval: pressInterval,
      propagate
    } = _processOptions(options);

    return Observable.create((obs) => {

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
        obs.next({
          keyName,
          event: Remote.EVENT_NAMES.KEY_DOWN,
          timepress: 0
        });
      };

      /**
       * Send 'press' event for the given key object (property from the keysObj
       * object).
       * @param {Object} keyObj
       */
      const sendPressEvent = ({ keyName, pushStart }) => {
        obs.next({
          keyName,
          event: Remote.EVENT_NAMES.KEY_PRESS,
          timepress: pushStart ? (Date.now() - pushStart) : 0
        });
      };

      /**
       * Send 'release' event for the given key object (property from the keysObj
       * object).
       * @param {Object} keyObj
       */
      const sendReleaseEvent = ({ keyName, pushStart }) => {
        obs.next({
          keyName,
          event: Remote.EVENT_NAMES.KEY_UP,
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

      this[keyEventListenerSymbol].register(keys, propagate, onEvent);

      return () => {
        // clear timeout for every key
        for (const key of Object.keys(keysObj)) {
          clearKeyTimeouts(keysObj[key]);
        }

        // clear catchers
        this[keyEventListenerSymbol].unregister(keys, onEvent);
      };
    });
  }
}

/**
 * Retrieve arguments (keys + options).
 * @param {...*} [args]
 * @return {Object} obj
 * @returns {Array} obj.keys
 * @returns {Object} obj.options
 */
const _processListenArguments = function(...args) {
  let keys; // key names
  const argsLen = args.length;
  const lastArg = argsLen && args[argsLen - 1];
  const hasOptions = typeof lastArg === 'object';
  const options = hasOptions ? lastArg : {};

  const getKeysFromNames = (names) =>
    names.reduce((kns, name) => {
      if (Object.keys(config.GROUPINGS).includes(name)) {
        return kns.concat(config.GROUPINGS[name]);
      }
      kns.push(name);
      return kns;
    }, []);

  if (hasOptions && argsLen > 1) {
    keys = getKeysFromNames(args.slice(0, argsLen - 1));
  } else if (!hasOptions && argsLen) {
    keys = getKeysFromNames(args);
  } else {

    // else keys is every key in the keymap
    keys = uniq(Object.values(config.KEY_MAP));
  }

  return { keys, options };
};

/**
 * Retrieve press options from the options arguments.
 * @param {Object} options - options as returned by _processListenArguments.
 * @returns {Object} opts - options as returned by
 * @returns {Number} [opts.after] - Time (after a keydown event) after which
 * a key press is triggered. Without this param, no press is possible.
 * @returns {Number} [opts.interval] - Interval (after 'after') on which the
 * press event is triggered. If not set, no press event interval is set.
 * @returns {Boolean} opts.propagate - wether the remote.listen call is
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

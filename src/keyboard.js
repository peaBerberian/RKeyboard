// TODO:
// V WHAT HAPPENS IF A KEY IS MAINTAINED WHILE A NON-PROPAGATING CALL COME AND GO?
// -> REEMIT. TEST IT
// SHOULD COMBINE DO A RELEASE? What about propagation?
// -> No for the moment
// COMBINATION OF KEYS: Ctrl+Up Ctrl>Up
import isSet from './misc/isSet.js';
import uniq from './misc/uniq.js';

import listen, { KEYCODES_PUSHED } from './events.js';
import KeyCatcher from './key_catcher.js';
import defaultConfig from './config.js';

const { DEFAULT_COMBINE_VALUE,
        DEFAULT_PROPAGATE_VALUE,
        DEFAULT_REEMIT_TIMEOUT,
        DEFAULT_PREVENT_DEFAULT } = config;

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
const EVENT_NAMES = { KEY_DOWN: 'push',
                      KEY_UP: 'release',
                      KEY_PRESS: 'press' };

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
export default (opt = {}) => {

  const keyMap = opt.keyMap || defaultConfig.KEY_MAP;

  const groupings = opt.groupings || defaultConfig.GROUPINGS;

  const defaultCombine = isSet(opt.combine) ? opt.combine :
                                              DEFAULT_COMBINE_VALUE;

  const defaultPropagate = isSet(opt.propagate) ? opt.propagate :
                                                  DEFAULT_PROPAGATE_VALUE;

  const defaultReemit = isSet(opt.reEmit) ? opt.reEmit :
                                            DEFAULT_REEMIT_TIMEOUT;

  const preventDefault = isSet(opt.preventDefault) ? opt.preventDefault :
                                                     DEFAULT_PREVENT_DEFAULT;

  // Create new propagation layer from the KeyCatcher
  const kc = KeyCatcher({ keyMap,
                          propagate: defaultPropagate,
                          reEmit: defaultReemit,
                          preventDefault });

  /**
   * Object where:
   *   - the keys are keyNames which are currently held, with a press option
   *     set.
   *   - the values are arrays contaning the corresponding keysObj (for every
   *     listen call).
   * Used to keep track of current presses to be able to clear them all if
   * a new non-propagating listen is done.
   *
   * @type Object
   */
  const activePresses = {};

  // We might need to listen events in our keyMap directly for
  // 'Combine' rules
  const listener = listen(Object.keys(keyMap).map(x => +x));

  return {
    listen(...args) {
      // get arguments
      const {
        keys = uniq(Object.values(keyMap)),
        options = {},
        callbackNext = () => {}
      } = _processArguments(groupings, ...args);

      // get after and interval options
      const {
        pressIntervals,
        reEmit: reEmitTimeout = defaultReemit,
        propagate: shouldPropagate = defaultPropagate,
        combine: shouldCombineKeys = defaultCombine
      } = _processOptions(options);

      // object used to know which key is pushed and when
      // for each keycode
      const keysObj = Object.keys(keyMap)

        // Only consider listened key
        .filter(keyCode => keys.includes(keyMap[keyCode]))

        // construct the keyObj object
        .reduce((vals, key) => {
          vals[key] = {
            // name of the key
            keyName: keyMap[key],

            // true if currently pushed
            isPushed: false,

            // timestamp of push start (null if not currently pushed)
            pushStart: null,

            // current press interval step. 1 is the first step.
            currentPressInterval: 0,

            // store a setInterval's return for press events
            interval: null,

            // store setTimeouts return for press events
            timeouts: []
          };

          return vals;
        }, {});

      /**
       * Clear current timeouts and/or interval for a specific key object.
       * @param {Object} keyObj
       * @param {Number|null} keyObj.timeouts
       * @param {Number|null} keyObj.interval
       */
      const clearKeyTimeouts = (keyObj) => {
        // 1 - clear timeouts
        keyObj.timeouts.forEach(t => clearTimeout(t));
        keyObj.timeouts = [];

        // 2 - clear intervals
        if (keyObj.interval) {
          clearInterval(keyObj.interval);
          keyObj.interval = 0;
        }

        // 3 - remove from activePresses object
        if (activePresses[keyObj.keyName]) {
          const keyActivePresses = activePresses[keyObj.keyName];
          const indexOf = keyActivePresses.indexOf(keyObj);
          activePresses[keyObj.keyName].splice(indexOf, 1);
          if (!keyActivePresses.length) {
            delete activePresses[keyObj.keyName];
          }
        }
      };

      /**
       * Send 'push' event for the given key object (property from the keysObj
       * object).
       * @param {Object} keyObj
       */
      const sendPushEvent = (ctx, keyObj) => {
        const { keyName } = keyObj;
        callbackNext.call(ctx, { keyName,
                                 event: EVENT_NAMES.KEY_DOWN,
                                 pressInterval: 0,
                                 timepress: 0 });
      };

      /**
       * Send 'press' event for the given key object (property from the keysObj
       * object).
       * @param {Object} keyObj
       */
      const sendPressEvent = (ctx, keyObj) => {
        const { keyName,
                currentPressInterval,
                pushStart } = keyObj;
        const timepress = isSet(pushStart) ? performance.now() - pushStart :
                                             0;
        callbackNext.call(ctx, { keyName,
                                 event: EVENT_NAMES.KEY_PRESS,
                                 pressInterval: currentPressInterval,
                                 timepress });
      };

      /**
       * Send 'release' event for the given key object (property from the keysObj
       * object).
       * @param {Object} keyObj
       */
      const sendReleaseEvent = (ctx, keyObj) => {
        const { keyName,
                currentPressInterval,
                pushStart } = keyObj;
        const timepress = isSet(pushStart) ? performance.now() - pushStart :
                                             0;
        callbackNext.call(ctx, { keyName,
                                 event: EVENT_NAMES.KEY_UP,
                                 pressInterval: currentPressInterval,
                                 timepress });
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
      const onEvent = function (evt) {

        // if keyName is not listened to, abort
        if (!keys.includes(evt.keyName)) {
          return;
        }

        switch (evt.type) {
          case 'keydown':
            onDownEvent(this, evt);
            break;
          case 'keyup':
            onUpEvent(this, evt);
            break;
        }
      };

      const startPressEvents = (ctx, keyObj) => {
        // start press timeouts + interval
        if (isSet(pressIntervals)) {

          // Update activePresses to add this keyObj reference to it.
          const keyActivePresses = activePresses[keyObj.keyName];
          activePresses[keyObj.keyName] = keyActivePresses ?
            keyActivePresses.push(keyObj) :
            [keyObj];

          /**
           * Set timeout and interval for a single pressInterval.
           * Update keyObj.interval and keyObj.pressInterval accordingly.
           * Returns the setTimeout's ID.
           * @param {Object} pressInterval
           * @param {Number} pressInterval.after
           * @param {Number} [pressInterval.interval]
           * @returns {Number} - setTimeout's ID.
           */
          const constructTimeout = (pressInterval) => {
            return setTimeout(() => {
              // 1 - clear possible previous interval
              if (keyObj.interval) {
                clearInterval(keyObj.interval);
              }

              // 2 - if an interval is set do a setInterval for key presses.
              // Reset keyObj.interval otherwhise
              if (isSet(pressInterval.interval)) {
                keyObj.interval = setInterval(() => {
                  sendPressEvent(ctx, keyObj);
                }, pressInterval.interval);
              } else {
                keyObj.interval = null;
              }

              // 3 - send initial press event
              keyObj.currentPressInterval++;
              sendPressEvent(ctx, keyObj);

            }, pressInterval.after);
          };

          // launch every interval here (doing every setTimeout synchronously is
          // more reliable than doing one by one)
          pressIntervals.forEach(pressInterval => {
            keyObj.timeouts.push(constructTimeout(pressInterval));
          });
        }
      };

      /**
       * Callback called when a 'keydown' event was received for a particular
       * key object (keyObj param).
       *
       * If the key is not already pushed:
       *   1. Begin timeouts and/or interval for press events if specified.
       *   2. Set right data on the key object
       *   3. Trigger a push event for the key
       * @param {Object} kcCtx - The keyCatcher's context. Used for
       * stopPropagation function.
       * @param {Object} keyObj - The key object
       */
      const onDownEvent = (kcCtx, { keyCode }) => {
        const keyObj = keysObj[keyCode];

        // if it is already pushed, abort
        if (keyObj.isPushed) {
          return;
        }

        // if this keydown is not for the last key pushed, abort.
        // (registration can be done after some keys have been pushed, and we
        // could have set a reEmit timeout)
        if (KEYCODES_PUSHED[KEYCODES_PUSHED.length - 1] !== keyCode) {
          return;
        }

        // context with which the callback will be called
        const cbCtx = { stopPropagation: kcCtx.stopPropagation };

        // start press events if wanted
        startPressEvents(cbCtx, keyObj);

        // set keyObj data
        keyObj.isPushed = true;
        keyObj.pushStart = performance.now();

        // send initial push event
        sendPushEvent(cbCtx, keyObj);
      };

      /**
       * Callback called when a 'keyup' event was received for a particular
       * key object (keyObj param).
       *
       * If the key is considered already pushed:
       *   1. clear timeouts and/or interval for press events if specified.
       *   2. Trigger a release event for the key
       *   2. Set right data on the key object
       * @param {Object} keyObj - The key object
       */
      const onUpEvent = (kcCtx, { keyCode }) => {
        const keyObj = keysObj[keyCode];

        // if no push event has been received, don't send release events
        // (this can happen if the key was pushed while we were not listening)
        if (!keyObj.isPushed) {
          return;
        }

        clearKeyTimeouts(keyObj);

        // context with which the callback will be called
        const cbCtx = { stopPropagation: kcCtx.stopPropagation };

        sendReleaseEvent(cbCtx, keyObj);

        keyObj.isPushed = false;
        keyObj.pushStart = null;
      };

      // if we do not want to combine keys, on any keyCode keydown event,
      // clear press timeouts for every key already pressed.
      let onAnyKeyDown;
      if (!shouldCombineKeys) {
        onAnyKeyDown = () => {
          Object.values(keysObj).forEach((k) => clearKeyTimeouts(k));
        };
        listener.on('keydown', onAnyKeyDown);
      }

      // if the newly defined listened key must not be propagated,
      // we have to stop emitting key presses for them.
      if (!shouldPropagate) {
        keys.forEach(keyName => {
          if (activePresses[keyName]) {
            activePresses[keyName].forEach(keyObj => {
              clearKeyTimeouts(keyObj);
            });
          }
        });
      }

      kc.register(keys, { propagate: shouldPropagate,
                          reEmit: reEmitTimeout }, onEvent);

      return () => {
        if (!shouldCombineKeys) {
          listener.off('keydown', onAnyKeyDown);
        }

        // clear timeouts for every key
        for (const key of Object.keys(keysObj)) {
          clearKeyTimeouts(keysObj[key]);
        }

        // clear catchers
        kc.unregister(keys, onEvent);
      };
    },

    close() {
      kc.close();
    }
  };
};

/**
 * Retrieve arguments (keys + options + callback).
 * undefined if not defined/null/ignored.
 * @param {Array.<string>} groupings
 * @param {...*} [args]
 * @return {Object} obj
 * @returns {Array.<string>|undefined} obj.keys - Every key names listened to.
 * Groupings are browsed to only include real key names.
 * @returns {Object|undefined} obj.options
 * @returns {Function|undefined} obj.callbackNext
 */
const _processArguments = function(groupings, ...args) {
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
      if (Object.keys(groupings).includes(name)) {
        return kns.concat(groupings[name]);
      }
      kns.push(name);
      return kns;
    }, []);

  const argsLen = args.length;
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
  } else if (!isSet(arg) && argsLen - 1 > argId) {
    argId++;
    arg = args[argId];
  }

  if (typeof arg === 'object' && arg !== null) {
    options = arg;
    argId++;
    arg = args[argId];
  } else if (!isSet(arg) && argsLen - 1 > argId) {
    argId++;
    arg = args[argId];
  }

  if (typeof arg === 'function') {
    callbackNext = arg;
  }

  return { keys,
           options,
           callbackNext  };
};

/**
 * Insertion sort algorithm for pressIntervals.
 * Insertion sort is preferred here as:
 *   1. The array is most probably already sorted by the caller
 *   2. The length of the Array have a high chance of being (very) small
 * /!\ Mutate the given array
 * @param {Array.<Object>} pressIntervals
 * @returns {Array.<Object>}
 */
const _sortPressIntervals = (pressIntervals) => {
  const len = pressIntervals.length;

  for (let i = 0; i < len; i++) {
    // That does not look like an efficient way of doing it, but it doesn't
    // matter here
    pressIntervals[i] = { after: +pressIntervals[i].after,
                          interval: +pressIntervals[i].interval };

    if (isNaN(pressIntervals[i].after)) {
      if (!isNaN(pressIntervals[i].interval)) {
        // In our case: { interval: 100 } == { press: 100, interval: 100 }
        pressIntervals[i].after = pressIntervals[i].interval;
      } else {
        // we have neither an after nor an interval, splice
        // it as it is an invalid pressIntervals
        pressIntervals.splice(i, 1);
        i--;
        continue;
      }
    } else if (isNaN(pressIntervals[i].interval)) {
      delete pressIntervals[i].interval;
    }

    const j = i;
    while ( j > 0 && pressIntervals[j - 1].after > pressIntervals[j].after) {
      const tmp = pressIntervals[j];
      pressIntervals[j] = pressIntervals[j - 1];
      pressIntervals[j - 1] = tmp;
    }
  }
  return pressIntervals;
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
  let pressIntervals, reEmit;
  const { propagate: propagateOpt,
          combine: combineOpt,
          reEmit: reEmitOpt,
          press: pressOpt } = options;

  if (isSet(pressOpt)) {
    if (Array.isArray(pressOpt)) {
      pressIntervals = _sortPressIntervals(pressOpt);
    } else {
      const afterOpt = +pressOpt.after;
      const intervalOpt = +pressOpt.interval;
      if (isNaN(afterOpt)) {
        if (!isNaN(intervalOpt)) {
          // In our case: { interval: 100 } == { press: 100, interval: 100 }
          pressIntervals = [{ after: intervalOpt,
                              interval: intervalOpt }];
        }
      } else if (isNaN(intervalOpt)) {
        pressIntervals = [{ after: afterOpt }];
      } else {
        pressIntervals = [{ after: afterOpt,
                            interval: intervalOpt }];
      }
    }
  }

  if (isSet(reEmitOpt)) {
    const reEmitNum = +reEmitOpt;
    if (!isNaN(reEmitNum)) {
      reEmit = reEmitNum;
    }
  }

  return { pressIntervals,
           combine: combineOpt,
           reEmit,
           propagate: propagateOpt };
};

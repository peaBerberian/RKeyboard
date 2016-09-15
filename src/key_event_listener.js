/**
 * This file defines a KeyEventListener class, allowing anyone to register
 * callbacks which can be triggered when a keyup / keydown event is received for
 * specific keys.
 *
 * It also manages propagation rules when multiple callbacks are registered on
 * the same KeyEventListener instance.
 *
 * This file can be imported and used directly for key management, but the
 * Remote class (./remote.js), which use directly this file, add multiple
 * welcomed abstractions.
 */

import { isSet, uniq } from '../../misc/utils.js';
import { addKeyEventListener, removeKeyEventListener } from './events.js';
import config from './config.js';

// used to construct a private (well, semi-private) property.
const keyCatchersSymbol = Symbol();

// used to construct a private (well, semi-private) property.
const onKeyDownSymbol = Symbol();

// used to construct a private (well, semi-private) property.
const onKeyUpSymbol = Symbol();

/**
 * Class allowing an easy management of key events, with customizable
 * propagation rules.
 *
 * Those events are received when a user provoked a keydown or keyup event on
 * the DOM.
 *
 * @class
 * @example
 * const kel = new KeyEventListener();
 *
 * const myFirstCallback = ({ type, keyName, keyCode }) =>
 *   // type: 'keydown' or 'keyup'
 *   // keyName: name of the key as defined in the keyMap
 *   // keyCode: keyCode of the key pressed
 *   console.log(type, keyName, keyCode);
 *
 * const mySecondCallback = (evt) => doSomethingWithIt(evt);
 *
 * // register keys 'Up' and 'Down'
 * kel.register(['Up', 'Down'], myFirstCallback);
 *
 * // this call will propagate 'Up' key events to the precedent one
 * kel.register(['Up', 'Left'], true, mySecondCallback);
 *
 * // this call will NOT propagate 'Down' key events to the precedent one
 * kel.register(['Down', 'Exit'], false, mySecondCallback);
 *
 * // unregister the first callback
 * kel.unregister(myFirstCallback);
 * // we could also have written:
 * // kel.unregister(['Up', 'Down'], myFirstCallback);
 * // to speed up the process 
 *
 * // unregister every keys but 'Exit' from mySecondCallback
 * kel.unregister(['Up', 'Left', 'Down'], mySecondCallback);
 *
 * // unregister Exit now
 * kel.unregister(['Exit'], mySecondCallback);
 */
const KeyEventListener = class {

  constructor() {

    /**
     * Here we define internal mechanisms to precisely manage propagation
     * for the KeyEventListener.
     *
     * We create a keyCatchers object which list which key listener can listen
     * to which key.
     *
     * To explain briefly how this magic works, I'm going to describe a basic
     * usecase:
     *
     * Imagine that you want to listen to the key "Up", to perform an action when
     * someone push it:
     *   1. A specific callback for your remote.listen call will be added to the
     *   keyCatchers.Up Array, which will look now like that:
     *   keyCatchers -> { Up: [ [a] ] } (where 'a' is your callback)
     *
     *   3. Now let's imagine that you got another remote.listen in another
     *   component and you don't don't want the events to propagate as long as this
     *   component is active.
     *   You will get add another callback, but the keyCatchers object will now
     *   change to something like:
     *   keyCatchers -> { Up: [ [a], [b] ] } (where 'b' is your new callback)
     *
     *   4. Now, we have another component which do another remote.listen call
     *   but which want to propagate the call. The 'b' callback will thus be called,
     *   but not the 'a' one as the 'b' one does not propagate. The keyCatchers
     *   object will look something like that:
     *   keyCatchers -> { Up: [ [a], [b, c] ] } (where 'c' is ... you understood!)
     *
     *   5. Now we unsubscribe the 'b' and 'c' ones. The 'a' one will now be able
     *   again to listen to the key Up and the keyCatchers object will look again
     *   like:
     *   keyCatchers -> { Up: [ [a] ] }
     *
     *   6. You made a really complicated application which has too much
     *   components. The keyCatchers can now look like something like that:
     *   keyCatchers -> { Up: [ [a], [c, g, h], [i, j] ], Enter: [ [h], [i] ] }
     *
     *   In this last example, only the 'i' and 'j' callbacks will be called for the
     *   key "Up" and only the 'i' for the key "Enter". As you can see, it is simply
     *   the last array from the keyCatchers.<KEY_NAME> array which is considered
     *   each time.
     */

    /**
     * List callbacks for each key in an array of array.
     * Progressively filled as callback are registered.
     * @type Object
     */
    const keyCatchers = {};
    this[keyCatchersSymbol] = keyCatchers;

    /**
     * Return list of active callbacks for the corresponding key.
     * @param {string} keyName
     * @returns {Array.Array.<Function>}
     */
    const getActiveCatchers = (keyName) => {
      // if keyCatchersLen is equal to a falsy value here, it means either:
      //   1. keyCatchers.<KEY_NAME> is not defined (never be listened to yet)
      //   2. keyCatchers.<KEY_NAME> is empty, meaning that noone is listening to
      //      it now (even if it has been listened to).
      const keyCatchersLen = keyCatchers[keyName] &&
        keyCatchers[keyName].length;

      if (!keyCatchersLen) {
        return [];
      }

      // get all callbacks for this keyName
      return keyCatchers[keyName][keyCatchersLen - 1].slice(0);
    };


    /**
     * Trigger every catcher callbacks for a particular key.
     * @param {string} type - 'keydown' or 'keyup'
     * @param {string} keyName - Key name as registered in the KeyMap. Can directly
     * be retrieved from the keyCode but added there for simplicity.
     * @param {Number} keyCode - KeyCode for the corresponding key. Still needed as
     * an id, in case multiple keyCodes have the same keyName.
     */
    const triggerCatchers = (type, keyName, keyCode) => {
      const callbacks = getActiveCatchers(keyName);

      // variable set at true only the first time we loop on callbacks.
      // Used to work arround a very specific usecase: a catcherCb being
      // unregistered when calling another catcherCb (!)
      let initial = true;

      // call the last callbacks registered first
      for (let i = callbacks.length - 1; i >= 0; i--) {
        const callback = callbacks[i];

        // callback could have been unregistered since if we are not on the
        // initial call.
        if (initial || getActiveCatchers(keyName).indexOf(callback) >= 0) {
          callback({ type, keyName, keyCode });
          initial = false;
        }
      }
    };

    this[onKeyDownSymbol] = ({ keyName, keyCode }) => 
      triggerCatchers('keydown', keyName, keyCode);

    this[onKeyUpSymbol] = ({ keyName, keyCode }) => 
      triggerCatchers('keyup', keyName, keyCode);
  }

  /**
   * Register a new catcher callback for a list of keys.
   * @param {Function} catcherCallback - The called callback each time a keyup
   * / keydown event is received for the corresponding keys.
   * This callback will have in arguments three values:
   *   1. eventName {string}: 'keydown' or 'keyup' for these respective events.
   *   2. keyName {string}: The name of the key from the key map.
   *   3. keyCode {Number}: The keyCode for the key pushed.
   *
   * List of params:
   *   - keyNames {Array.<string>} - The array of key name to listen to.
   *   - propagate {Boolean} (optional) - Wether the call should be propagated. 
   *   - callback {Function} - The called callback once the corresponding key
   *     has been pushed. You can also set this callback as a second argument if
   *     you don't want to set any propagate value.
   *     This callback will be called with an object as argument having the
   *     following keys:
   *       - type {string} - 'keyup' or 'keydown'
   *       - keyName {string} - the name of the key
   *       - keyCode {Number} - the keyCode of the key
   *
   * @example
   * const kel = new KeyEventListener();
   *
   * kel.register(['Up', 'Down', 'Left', 'Right'], function(evt) {
   *   switch (evt.type) {
   *     case 'keydown':
   *       console.log('direction button pushed:', evt.keyName);
   *       break;
   *     case 'keyup':
   *       console.log('direction button released:', evt.keyName);
   *       break;
   *   }
   * });
   *
   * // Now, the 'Up' key will be catched only by the following callback, as it
   * // does not propagate.
   * kel.register(['Up'], false, function() {
   *   console.log('Up received and not propagated');
   * });
   *
   * // Here we catch the 'Down' key but still propagate it to the precedent
   * // callback for it (the first one declared here).
   * kel.register(['Down'], true, function() {
   *   console.log('Down received and propagated to the previous callback' +
   *     ' declared for it');
   * });
   */
  register(...args) {
   
    const processArguments = (...args) => {
      return (args.length === 2 && typeof args[1] === 'function') ? {
        keyNames: isSet(args[0]) ?
          args[0] : uniq(Object.values(config.KEY_MAP)),
        callback: args[1]
      } : {
        keyNames: isSet(args[0]) ?
          args[0] : uniq(Object.values(config.KEY_MAP)),
        propagate: isSet(args[1]) ?
          args[1] : config.DEFAULT_PROPAGATE_VALUE,
        callback: args[2]
      };
    };

    /**
     * Add a new callback for a specific keyName.
     * @param {string} keyName
     */
    const registerKeyListener = (keyName) => {
      const keyCatchers = this[keyCatchersSymbol];

      // If no key are registered, link trigger to events
      if (!Object.keys(keyCatchers).length) {
        addKeyEventListener('keydown', this[onKeyDownSymbol]);
        addKeyEventListener('keyup', this[onKeyUpSymbol]);
      }

      const keyArr = keyCatchers[keyName];

      // if keyArr does not exist, it means that nobody has listened to this key
      // yet. Create the array of array with the callback inside.
      if (!keyArr) {
        keyCatchers[keyName] = [[callback]];

      } else if (propagate) {
        const keyArrLen = keyArr.length;

        // if keyArrLen is equal to 0, no one is listening yet. Push just the
        // callback.
        if (!keyArrLen) {
          keyArr.push([callback]);

        } else {
          // else, as we want to propagate, push the callback to the last array
          // in keyArr.
          keyArr[keyArrLen - 1].push(callback);
        }
      } else {
        // we do not want to propagate here, push an array with only the
        // callback at the last level.
        keyArr.push([callback]);
      }
    };

    const {
      keyNames,
      propagate,
      callback
    } = processArguments(...args);

    // all arguments are mandatory, propagate just needs to be truthy/falsy
    if (!keyNames || !callback) {
      return;
    }

    for (const keyName of keyNames) {
      registerKeyListener(keyName);
    }
  }

  /**
   * Unregister a catcher callback (it will not be called anymore for the
   * corresponding keys).
   *
   * List of params:
   *   - keyNames {Array.<string>} (optional) - The keynames you wish to delete
   *     the callback for. If not specified, the callback will be searched for
   *     for every keys.
   *   - callback {Function} - The registered callback you want to unregister.
   *     Must be the exact reference, like any removeEventListener. Can be set
   *     as a first argument if you do not want to filter by keys.
   *
   * @example
   * const someCallback = (arg) => { console.log(arg); };
   * const kel = new KeyEventListener();
   * kel.register(['Up', 'Down'], false, someCallback);
   *
   * // unregister just for 'Up'
   * kel.unregister(['Up'], someCallback);
   *
   * // unregister for all
   * kel.unregister(someCallback);
   */
  unregister(...args) {
    const processArguments = (...args) => {
      return (args.length === 1 && typeof args[0] === 'function') ? {
        keyNames: uniq(Object.values(config.KEY_MAP)),
        callback: args[0]
      } : {
        keyNames: isSet(args[0]) ?
          args[0] : uniq(Object.values(config.KEY_MAP)),
        callback: args[1]
      };
    };

    /**
     * Remove reference to a callback for a specific key
     * @param {string} keyName - The key name
     */
    const unregisterKeyListener = (keyName) => {
      const keyCatchers = this[keyCatchersSymbol];

      // if the key is not in the keyCatchers object, no one has registered to
      // it.
      if (!keyCatchers || !keyCatchers[keyName]) {
        return;
      }

      for (let i = keyCatchers[keyName].length - 1; i >= 0; i--) {
        const callbackArray = keyCatchers[keyName][i];
        const indexOf = callbackArray.indexOf(callback);
        if (indexOf >= 0) {
          // remove callback reference from this array
          keyCatchers[keyName][i].splice(indexOf, 1);

          // if the callbacks array, for the current propagation level, is now
          // empty, delete it.
          if (!callbackArray.length) {
            keyCatchers[keyName].splice(i, 1);

            // if the key array is now empty, delete it.
            if (!keyCatchers[keyName].length) {
              delete keyCatchers[keyName];
            }

            // if no more key events are listened to, remove event listener
            if (!Object.keys(keyCatchers).length) {
              removeKeyEventListener('keydown', this[onKeyDownSymbol]);
              removeKeyEventListener('keyup', this[onKeyUpSymbol]);
            }
          }

          // we already found the callback here, there is no way that it is
          // somewhere else for this keyName.
          return;
        }
      }
    };

    const  { keyNames, callback } = processArguments(...args);

    // if a mandatory param is not here, we cannot continue
    if (!callback || !keyNames) {
      return;
    }

    for (const keyName of keyNames) {
      unregisterKeyListener(keyName);
    }
  }
};

export default KeyEventListener;

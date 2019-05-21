import createKeyboard from '../keyboard.js';

/**
 * Default Keyboard implementation.
 *
 * @example
 * ```js
 * import RKeyboard from 'rkeyboard';
 *
 * const keyboard = Rkeyboard();
 *
 * // trigger a callback for the 'Up' key keydown events
 * const keyListener = keyboard('Up',  {
 *  onPush: (e) => {
 *    // 'push' as it is the only event listened here
 *    console.log(e.event);
 *
 *    // 'Up' as it is the only key listened to here
 *    console.log(e.keyName);
 *
 *    // Time the key has been pushed in ms (0 for 'push' events)
 *    console.log(e.timepress);
 *
 *    // ...
 *  }
 * });
 *
 * // Doing the same for multiple keys ('Up' OR 'Enter')
 * const upAndEnter = keyboard(['Up', 'Enter'], {
 *   onPush: (e) => {
 *     console.log(`${e.keyName} pushed!`);
 *   }
 * });
 *
 * // Doing something on keyup
 * const upAndEnterRelease = keyboard(['Up', 'Enter'], {
 *   onRelease: (e) => {
 *     // 'release'
 *     console.log(e.event);
 *
 *     console.log(`${e.keyName} released!`);
 *   }
 * });
 *
 * // Doing the same for all keys
 * const upAndEnter = keyboard(null, {
 *   onRelease: (e) => {
 *     console.log(`${e.keyName} released!`);
 *   }
 * });
 *
 * // add custom key press rules for the 'Up' key
 * const withPress = keyboard('Up', {
 *   press: {
 *     after: 1000,
 *     interval: 2000
 *   },
 *   onPress: (e) => {
 *     // 'press'
 *     console.log(e.event);
 *
 *     console.log(`${e.keyName} pressed!`);
 *   }
 * });
 *
 * // what if we want press rules for ALL keys?
 * // We again ignore the first argument.
 * const allKeysWithPress = keyboard({
 *   press: {
 *     after: 1000,
 *     interval: 2000
 *   },
 *
 *   // catch all events (push+press+release)
 *   onEvent: (e) => {
 *     // ...
 *   },
 *
 *   // catch 'down' events (push+press)
 *   onDown: (e) => {
 *     // ...
 *   }
 * });
 *
 * // -- start and stop listening to keys --
 *
 * // first listen to the key and store the returned object
 * const myKeyListener = keyboard('Up', { onPush: () => {} });
 *
 * // free the event listener
 * myKeyListener.unbind();
 * ```
 */
function RKeyboard(opt) {
  const kb = createKeyboard(opt);

  const callIfExist = (cb, evt) => cb && cb(evt);

  const getArgs = (arg1, arg2) => {
    if (Array.isArray(arg1) || typeof arg1 === 'string') {
      return {
        keys: arg1,
        options: arg2
      };
    }

    return {
      options: arg1
    };
  };

  return {
    listen(...args) {
      const {
        keys,
        options = {}
      } = getArgs(...args);

      const {
        onPush,
        onRelease,
        onPress,
        onDown,
        onEvent,
        onUnbind,
        ...keyOptions
      } =  options;

      const stopListening = kb.listen(keys, keyOptions, (evt) => {
        switch (evt.event) {
          case 'push':
            callIfExist(onPush, evt);
            callIfExist(onDown, evt);
            break;
          case 'press':
            callIfExist(onPress, evt);
            callIfExist(onDown, evt);
            break;
          case 'release':
            callIfExist(onRelease, evt);
            break;
        }
        callIfExist(onEvent, evt);
      });

      return {
        unbind() {
          callIfExist(onUnbind);
          stopListening();
        }
      };
    },

    free() {
      kb.close();
    }
  };
}

export default RKeyboard();

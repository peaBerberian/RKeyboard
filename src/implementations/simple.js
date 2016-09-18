import createKeyboard from '../keyboard.js';

/**
 * Improve the Keyboard by offering a simpler interface.
 *
 * @type {Object}
 * @example
 * import { SimpleKeyboard } from 'keyboardjs';
 *
 * const kb = SimpleKeyboard.create();
 *
 * const myKeys = kb('Enter', 'Up', 'Down', { press: { after: 200 } });
 *
 * // catch 'push' events only (first keydown)
 * myKeys.onPush = (e) => {
 *   // 'push' here
 *   console.log(e.event);
 *
 *   // 'Enter', 'Up' or 'Down' as they are the only keys listened to
 *   console.log(e.keyName);
 *
 *   // Time the key has been pushed in ms (0 for 'push' event)
 *   console.log(e.timepress);
 *
 *   // ...
 * };
 *
 * // catch 'press' events (here, after 200ms of press)
 * myKeys.onPress = (e) => {
 *   // ...
 * };
 *
 * // catch 'release' events (keyup)
 * myKeys.onRelease = (e) => {
 *   // ...
 * };
 *
 * // catch every events (all 3 of them)
 * myKeys.onEvent = (e) => {
 *   // ...
 * };
 *
 * // catch both push and press events
 * myKeys.onDown = (e) => {
 *   // ...
 * };
 *
 * // stop listening to these keys
 * myKeys.stopListening();
 */
export default {
  create() {
    const kb = createKeyboard();
    return (...args) => {
      const ret = {};

      const callIfExist = (fnName, evt) => {
        if (typeof ret[fnName] === 'function') {
          ret[fnName](evt);
        }
      };

      ret.stopListening = kb(...args.concat(
        (evt) => {
          callIfExist('onEvent', evt);
          switch (evt.event) {
            case 'push':
              callIfExist('onPush', evt);
              callIfExist('onDown', evt);
              break;
            case 'press':
              callIfExist('onPress', evt);
              callIfExist('onDown', evt);
              break;
            case 'release':
              callIfExist('onRelease', evt);
              break;
          }
        }));
      return ret;
    };
  }
};

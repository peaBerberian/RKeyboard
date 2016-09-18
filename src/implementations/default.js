import createKeyboard from '../keyboard.js';

/**
 * Default Keyboard implementation.
 *
 * @example
 * import Keyboard from 'keyboardJs';
 *
 * const kb = Keyboard.create();
 *
 * // simply listening to the 'Enter', 'Up' and 'Down' keys
 * kb('Enter', Up', 'Down', (e) => {
 *   // either 'push' or 'release'
 *   console.log(e.event);
 *
 *   // 'Enter', 'Up' or 'Down' as they are the only keys listened to
 *   console.log(e.keyName);
 *
 *   // Time the key has been pushed in ms (0 for 'push' event)
 *   console.log(e.timepress);
 *
 *   // ...
 * });
 *
 * // listen to key press event on Up key configured with `after` and
 * // `interval` options
 * kb('Up', { press: { after: 1000, interval: 2000 }, (e) => {
 *   // either 'push', 'release' or 'press'
 *   console.log(e.event);
 *
 *   // ...
 * });
 *
 * // stop listening
 * const stopListening = kb('Left', (e) => {
 *   // ...
 * });
 *
 * stopListening();
 */
export default {
  create: createKeyboard
};

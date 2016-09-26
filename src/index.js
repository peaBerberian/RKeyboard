/**
 * This project is separated over multiple files:
 *
 *   - index.js: exports the general Keyboard module.
 *
 *   - events.js: adds an addKeyEventListener and a removeKeyEventListener
 *     function allowing anyone to define custom event listeners which:
 *       - only catch the keys defined in the key map.
 *       - prevent the default behavior for those keys.
 *       - avoid too much consecutive keydowns.
 *       - pass directly processed key events objects.
 *
 *   - key_catcher.js: defines a function allowing you to register and
 *     trigger callbacks on keydown / keyups with custom propagation rules.
 *
 *   - keyboard.js: defines a Keyboard factory, then used by any element
 *     wanting to perform actions on keyboard keys.
 *
 *   - implementations/*.js: multiple keyboard implementations. All based on
 *     keyboard.js.
 *
 * When starting listening to a key, the code called usually travel this way:
 * _application_ -> keyboard.js -> key_catcher.js
 *
 * When a new keyboard event arrives, the code called usually travel this way:
 * events.js -> key_catcher.js -> keyboard.js -> _application_
 */

import './misc/polyfill.js';
import RxKeyboard from './implementations/rx.js';
import RKeyboard from './implementations/default.js';
import createKeyboard from './keyboard.js';

export {
  RKeyboard,
  RxKeyboard,
  createKeyboard
};

window.RKeyboard = RKeyboard;
export default RKeyboard;

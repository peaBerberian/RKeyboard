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

import RxKeyboard from './implementations/rx.js';
import SimpleKeyboard from './implementations/simple.js';
import MinimalKeyboard from './implementations/minimal.js';
import RKeyboard from './implementations/small.js';
import config from './config.js';
import createKeyboard from './keyboard.js';

// Allow users to modify the following config keys
[Keyboard, RxKeyboard, SimpleKeyboard].forEach(implem => {
  [
    'KEY_MAP',
    'GROUPINGS',
    'DEFAULT_PROPAGATE_VALUE',
    'CONSECUTIVE_KEYDOWNS_INTERVAL'
  ].forEach(conf => {
    Object.defineProperty(implem, conf, {
      get: () => config[conf],
      set: (val) => config[conf] = val,
    });
  });
});

/**
 * Every options are... optional.
 */
const options = {
  // whether the received key event should be propagated to its next listener.
  // defaults to RKeyboard.DEFAULT_PROPAGATE_VALUE
  propagate: true,
 
  // press options
  // if not set, no press event will be sent
  press: {
    after: 1000,
    interval: 2000
  },

  // callback called as the key is pushed (first keydown)
  onPush: () => {},

  // callback called as the key is released (keyup)
  onRelease: () => {},

  // callback called as the key is pressed (see press options)
  onPress: () => {},

  // callback called on 'push' AND 'press'
  onDown: () => {},

  // callback called on 'push', 'press' AND 'release'
  onEvent: () => {},

  // callback called when you remove this event listener
  onClose: () => {}
};

const myKeys1 = kb(['Enter', 'Up', 'a'], {
  onPush: (evt) => {
    console.log('You pushed the key ${evt.keyName}');
  }
});

const myKeys2 = kb(['Enter', 'Up', 'a'], {
  press: { after: 500 },

  onPush: (evt) => {
    console.log('You pushed the key ${evt.keyName}');
  },

  onPress: (evt) => {
    console.log('You pressed the key ${evt.keyName} for 500ms');
  }
});

// stop listening
myKeys2();

export {
  MinimalKeyboard,
  RKeyboard,
  SimpleKeyboard,
  RxKeyboard,
  createKeyboard
};

export default RKeyboard;

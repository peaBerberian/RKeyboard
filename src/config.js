export default {

  /**
   * This keyboard's keymap.
   *
   * Link easy-to-remember KeyNames to their respective keyCode(s).
   *
   * This is an object where:
   *   1. The keys are the keyCodes (as in event's keyCode)
   *   2. The values are the names as used in the webapp.
   * @type Object
   */
  KEY_MAP: {
    // 8: 'Back', // Backspace
    9: 'Tab', // Tab
    13: 'Enter', // Enter
    16: 'Shift', // Shift
    17: 'Ctrl', // Control
    18: 'Alt', // Alt
    19: 'Pause', // Pause/Break
    20: 'Caps', // Caps Lock
    27: 'Esc', // Escape
    32: 'Space', // Space
    33: 'PageUp', // Page Up
    34: 'PageDown', // Page Down
    35: 'End', // End
    36: 'Home', // Home
    37: 'Left', // Left arrow
    38: 'Up', // Up arrow
    39: 'Right', // Right arrow
    40: 'Down', // Down arrow
    45: 'Insert', // Insert
    46: 'Delete', // Delete
    48: 'Num0', // 0
    49: 'Num1', // 1
    50: 'Num2', // 2
    51: 'Num3', // 3
    52: 'Num4', // 4
    53: 'Num5', // 5
    54: 'Num6', // 6
    55: 'Num7', // 7
    56: 'Num8', // 8
    57: 'Num9', // 9
    65: 'a', // a
    66: 'b', // b
    67: 'c', // c
    68: 'd', // d
    69: 'e', // e
    70: 'f', // f
    71: 'g', // g
    72: 'h', // h
    73: 'i', // i
    74: 'j', // j
    75: 'k', // k
    76: 'l', // l
    77: 'm', // m
    78: 'n', // n
    79: 'o', // o
    80: 'p', // p
    81: 'q', // q
    82: 'r', // r
    83: 's', // s
    84: 't', // t
    85: 'u', // u
    86: 'v', // v
    87: 'w', // w
    88: 'x', // x
    89: 'y', // y
    90: 'z', // z
    91: 'Window', // Left window key
    92: 'Window', // Right window key
    93: 'Select', // Select key
    96: 'Num0', // numpad 0
    97: 'Num1', // numpad 1
    98: 'Num2', // numpad 2
    99: 'Num3', // numpad 3
    100: 'Num4', // numpad 4
    101: 'Num5', // numpad 5
    102: 'Num6', // numpad 6
    103: 'Num7', // numpad 7
    104: 'Num8', // numpad 8
    105: 'Num9', // numpad 9
    106: 'Multiply', // *
    107: 'Add', // +
    109: 'Subtract', // -
    110: 'DecimalPoint', // .
    111: 'Divide', // Divice
    112: 'f1', // f1
    113: 'f2', // f2
    114: 'f3', // f3
    115: 'f4', // f4
    116: 'f5', // f5
    117: 'f6', // f6
    118: 'f7', // f7
    119: 'f8', // f8
    120: 'f9', // f9
    121: 'f10', // f10
    122: 'f11', // f11
    123: 'f12', // f12
    144: 'NumLock', // Num Lock
    145: 'ScrollLock', // Scroll Lock
    186: 'SemiColon', // ;
    187: 'Equal', // =
    188: 'Comma', // ,
    189: 'Dash', // -
    190: 'Point', // .
    191: 'Slash', // .
    192: 'BackTick', // `
    219: 'OpenBracket', // {
    220: 'BackSlash', // \
    221: 'CloseBracket', // }
    223: 'SingleQuote' // '
  },

  /**
   * Grouping of KeyNames, that can be used as a shortcut instead of each of its
   * keynames in the keyboard.
   *
   * @type {Object}
   */
  GROUPINGS: {
    Nums: [
      'Num0',
      'Num1',
      'Num2',
      'Num3',
      'Num4',
      'Num5',
      'Num6',
      'Num7',
      'Num8',
      'Num9'
    ],
    Directions: [
      'Up',
      'Down',
      'Left',
      'Right'
    ],
    Letters: [
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'q',
      'r',
      's',
      't',
      'u',
      'v',
      'w',
      'x',
      'y',
      'z'
    ],
  },

  /**
   * Default value for the Keyboard propagate option, allowing - or not - a
   * keyboard call for specific keys to be propagated through precedent ones.
   *
   * Basically:
   *   - If set to false, the last listener is the only one to catch the wanted
   *     keys by default (not propagated to the next listener).
   *
   *   - If set to true, we call the callbacks from the last to the first
   *     listeners by default.
   *
   * Bear in mind that:
   *   - a propagate option can still be defined for each listener.
   *   - even if propagating, a propagation can still stop via
   *     this.stopPropagation on listeners.
   * @type Boolean
   */
  DEFAULT_PROPAGATE_VALUE: true,

  /**
   * Default value for the Keyboard combine option, allowing - or not -
   * multiple simultaneous keydown to be processed simultaneously.
   *
   * You can set it to false to emulate the real 'keydown' events.
   *
   * Basically:
   *   - If set to false:
   *       1. The last key pushed will interrupt the eventual press events from
   *          all the other keys held (a release event will still be sent on
   *          release from every key).
   *       2. If the reEmit option is activated, only the last key held will be
   *          reEmitted.
   *
   *   - If set to true:
   *       1. Every keys will emit push, press and release events, even if
   *          multiple keys are pushed simultaneously.
   *       2. If the reEmit option is activated, every held keys will be
   *          reEmitted on a row (from the oldest to the newest).
   *
   * @type Boolean
   */
  DEFAULT_COMBINE_VALUE: true,

  /**
   * Interval, in ms, to which we should reEmit a key 'push' event if the key
   * was pushed before the listener was added (in the condition the key was not
   * released since).
   *
   * Basically:
   *   - If inferior to 0, only key(s) pushed after the listener declaration
   *     will trigger events.
   *   - If set to a value >=0, key(s) pushed before the declaration will be
   *     reEmitted after this value * 1ms (if the key(s) is/are still held).
   *     Note: whether multiple keys are re-sent also depends on the
   *     'combine' option.
   */
  DEFAULT_REEMIT_VALUE: 500,

  DEFAULT_PREVENT_DEFAULT: false
};

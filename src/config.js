export default {

  /**
   * This remote's keymap.
   *
   * Link easy-to-remember KeyNames to their respective keyCode(s).
   *
   * This is an object where:
   *   1. The keys are the keyCodes (as in event's keyCode)
   *   2. The values are the names as used in the webapp.
   * @type Object
   */
  KEY_MAP: {
    37: 'Left', // Left arrow
    38: 'Up', // Up arrow
    39: 'Right', // Right arrow
    40: 'Down', // Down arrow
    13: 'Enter', // Enter
    8: 'Back', // Backspace
    9: 'Tab', // Tab
    27: 'Esc', // Escape
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
  },

  /**
   * Grouping of KeyNames, that can be used as a shortcut instead of each of its
   * keynames in the remote.
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
    ]
  },

  /**
   * Default value for the Remote propagate option, allowing - or not - a
   * remote.listen call to be propagated through precedent ones.
   *
   * Basically:
   *   - If set to false, the last remote.listen call is the only one to be
   *     active by default (propagate option not explicitely defined).
   *
   *   - If set to true, we call the callbacks from the last to the first
   *     remote.listen calls by default (propagate option not explicitely
   *     defined).
   * @type Boolean
   */
  DEFAULT_PROPAGATE_VALUE: false,

  DEFAULT_COMBINE_VALUE: true
};

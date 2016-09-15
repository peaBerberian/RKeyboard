import KeyMap from '../keys.js';

export default {
  /**
   * Interval at which consecutive keydown events (__NOT__ 'push' events) are
   * sent to the Remote when a key is pressed (not released).
   *
   * This is then processed to become 'push' events, if the current
   * Remote.listen call did not yet produce one, or no events at all if it
   * already sent one.
   *
   * This can be seen as a way to overwrite the interval set by the OS.
   *
   * You can set this value at 0 if you want to deactivate consecutives
   * keydowns.
   *
   * @see CONSECUTIVE_KEYDOWNS_OBJECT in ./events.js
   * @type Number
   */
  CONSECUTIVE_KEYDOWNS_INTERVAL: 900,

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

  /**
   * This remote's keymap.
   * This is an object where:
   *   1. The keys are the keyCodes (as in event's keyCode)
   *   2. The values are the names as used in the webapp.
   * @type Object
   */
  KEY_MAP: KeyMap
};

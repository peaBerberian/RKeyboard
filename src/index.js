/**
 * This directory defines the way the remote is managed in the webapp.
 *
 * It's actually separated over multiple files:
 *
 *   - index.js: exports a new general remote (as well as the class definition,
 *     for creating new ones).
 *
 *   - events.js: adds an addKeyEventListener and a removeKeyEventListener
 *     function allowing anyone to define custom event listeners which:
 *       - only catch the keys defined in the key map.
 *       - prevent the default behavior for those keys.
 *       - avoid too much consecutive keydowns.
 *       - pass directly processed key events objects.
 *
 *   - key_event_listener.js: defines a class allowing you to register and
 *     trigger callbacks on keydown / keyups with custom propagation rules.
 *
 *   - remote.js: defines the Remote class, then used by any element wanting to
 *     perform actions on remote keys. Allows these elements to use simple
 *     observables and a complete API (managing even custom key presses).
 *
 * When starting listening to a key, the code called usually travel this way:
 * _Component_ -> remote.js -> key_event_listener.js
 *
 * When a new keyboard event arrives, the code called usually travel this way:
 * events.js -> key_event_listener.js -> remote.js -> _Component_
 */

import Remote from './remote.js';

// export new instance of the remote by default
export default new Remote();

// still export Remote class for possible future usages.
export {
  Remote
};

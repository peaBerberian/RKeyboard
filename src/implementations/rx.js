import createKeyboard from '../keyboard.js';

/**
 * Adapt the Keyboard to the RxJS architecture by transforming listening
 * requests into Observer functions.
 *
 * @type {Object}
 * @example
 * import { RxKeyboard } from 'Keyboardjs';
 * import { Observable } from 'rxjs';
 *
 * const kb = RxKeyboard.create();
 *
 * // start listening
 * new Observable(kb(['Enter', 'Up', 'Down']))
 *   .subscribe((e) => {
 *     // ...
 *   });
 *
 * // to stop listening, just unsubscribe from the Observable
 * const sub = rx.Observable.create(kb()).subscribe();
 * sub.unsubscribe();
 */
export default {
  create() {
    const kb = createKeyboard();
    return (...args) =>
      kb(
        ...args.concat((evt) => (obs) => {
          obs.next(evt);
          return kb();
        })
      );
  }
};

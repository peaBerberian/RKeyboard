# RxKeys
Complex keyboard management made easy using RxJS observables.

## Examples

### Simple events

```js
import Keyboard from 'RxKeys';

// Instanciating a new Keyboard
// Why, you may ask? Each instance has its own propagations rules.
// This concept is a little complex, so let's see what we can do
// progressively.
const kb = new Keyboard();

/*
 * 1. Listening to a single Key
 * We can directly put 'Enter' because each key has a default "name".
 * Those are confirgurable as we will see.
 */
kb.listen('Enter').subscribe((key) => {
  // 'push' or 'release'
  switch (key.event) {
    case 'push':
      console.log('Enter key pushed!');
      break;

    case 'release':
      console.log('Enter key released!');
      break;

    default:
      console.log('This should not happen!');
  }
});

/*
 * 2. Listening to multiple keys at the same time
 */
kb.listen('Left', 'Right').subscribe((key) => {
  // the name of the key pressed. Here 'Left' or 'Right'
  const keyName = key.keyName;

  if (key.event === 'push')
    console.log(`${keyName} key pushed!`);
  else {
    console.log(`${keyName} key released!`);
});

/*
 * 3. Listening to a group of keys (Configurable)
 */
kb.listen('Directions').subscribe((key) => {
  // the name of the key pressed. Here 'Left', 'Right'
  // 'Up' or 'Down'
  const keyName = key.keyName;

  if (key.event === 'push')
    console.log(`${keyName} key pushed!`);
  else {
    console.log(`${keyName} key released!`);
});

/*
 * 4. Listening to every keys declared (configurable).
 */
kb.listen().subscribe((key) => {
  if (key.event === 'push')
    console.log(`${keyName} key pushed!`);
  else {
    console.log(`${keyName} key released!`);
});
```

### Press events

```js
import Keyboard from 'RxKeys';
const kb = new Keyboard();

/*
 * 1. Emit 'press' event after 500 ms if the key is pushed
 * without being released
 */
const options = {
  press: {
    after: 500
  }
};

kb.listen('Up', 'Down', options).subscribe((key) => {
  // here key.event can still be 'push' or 'release'
  // but the 'press' event is added for our case
  if (key.event === 'press')
    console.log(`${keyName} key pressed for 500ms!`);

  // PS: We could just filter the press event via the RxJS
  // operator:
  // kb.listen(...).filter(e => e.event === 'press')
});

/*
 * 2. Emit 'press' events EVERY 500 ms while the key is pushed
 * without being released
 */
const options = {
  press: {
    interval: 500
  }
};

kb.listen('Up', 'Down', options)
  .filter(e => e.event === 'press')
  .subscribe((key) => {
    const keyName = key.keyName;
    const timepress = key.timepress;
    console.log(`${keyName} key pressed for ${timepress}!`);
  });

/*
 * 3. Emit 'press' events:
 *   1. AFTER 500ms as the key is pushed without being released
 *   2. EVERY 200ms after that (until the release)
 */
const options = {
  press: {
    after: 500
    interval: 200
  }
};

kb.listen('Up', 'Down', options)
  .filter(e => e.event === 'press')
  .subscribe((key) => {
    const keyName = key.keyName;
    const timepress = key.timepress;
    console.log(`${keyName} key pressed for ${timepress}!`);
  });
```
### Propagation rules

```js
import Keyboard from 'RxKeys';
const kb = new Keyboard();

// Here, we can take control of the key 'Enter' and 'End'.
const sub1 = kb.listen('Enter', 'End')
  .subscribe(() =>
    console.log(' I should receive both Enter and End here')
  );

// Here, we are the one taking the control of the key 'Enter'.
// sub1 will not receive events for 'Enter'.
// It will for 'End' though as we ignore this one.
const sub2 = kb.listen('Enter')
  .subscribe(() =>
    console.log('I\'m the only one to receive Enter')
  );

// By unsubscribing, we give back the control to sub1.
sub2.unsubscribe();

// Here, we set the propagate option to true.
// That way, both sub3 and sub1 receive events for the 'Enter'
// key.
const sub3 = kb.listen('Enter', { propagate: true })
  .subscribe(() =>
    console.log('I\'m the FIRST one to receive Enter')
  );

// NOTE: We can put as many propagation level as we want.
//
// Example: sub55 propagate a key to sub54 which propagate to sub53
// which does NOT propagate to sub52.
// In this case, sub52 will receive the event only if sub55, sub54
// AND sub53 unsubscribe.
// This can go on and on to sub1 with multiple layer of propagations.

// Declaring two instances. Each has its own propagation layers.
const kb1 = new Keyboard();
const kb2 = new Keyboard();

kb1.listen('Enter').subscribe(() => console.log('a'));

kb2.listen('Enter').subscribe(() => console.log('b'));
kb2.listen('Enter').subscribe(() => console.log('c'));
kb2.listen('Enter', { propagate: true })
  .subscribe(() => console.log('d'));


// If we press the 'Enter' key, we get the following output:
// a
// d
// c
```

### Configuration
```js
import Keyboard from 'RxKeys';

// Replacing the default key map.
// Example: we want to distinguish numeric keys from the
// 'numeric pad' keys.
Keyboard.KEY_MAP = {
  48: 'Num0',
  49: 'Num1',
  //...
  57: 'Num9',

  96: 'Numpad0',
  97: 'Numpad1',
  // ...
  105: 'Num9'
};

// Replacing the default Groupings for the same reason
Keyboard.GROUPINGS = {
  Numeric: ['Num0', 'Num1'/*, ... */, 'Num9'],
  Numpad: ['Numpad0', 'Numpad1'/*, ... */, 'Numpad9']
};

// I want every Keyboard to propagate by default
Keyboard.DEFAULT_PROPAGATE_VALUE = true;

// This one is a little complicated.
// It indicates an interval at which keydown-like events
// are re-emitted for the Keyboard (until the release).
//
// After being emitted, two cases:
//   1. The current listen call for this key already
//      received a keydown. In this case, this has no
//      effect.
//   2. The current listen call did not receive the
//      keydown event for this key yet, a 'push' event
//      is emitted.
//      This can happen in the following cases:
//        - The listen call was done after the real push
//          event.
//        - The listen call was re-activated after the
//          push because another non-propagating one
//          unsubscribed after this push.
//
// Put at 0 to deactivate this feature.
Keyboard.CONSECUTIVE_KEYDOWNS_INTERVAL = 500; // 500ms
```
>  // The event property tells us which type of event happened.
>  // it can be:
>  //   - 'push': the key is pushed
>  //   - 'release': the key is released
>  //   - 'press': custom event, we will see that one later.

## TODOS
- Test launcher
- Add tests for Groupings
- Improve the documentation
- Improve the KeyEventListener class or integrate it to the remote
- Add recompose functions for an easier integration to React

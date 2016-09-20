# R-Keyboard

RKeyboard is a tool allowing complex keybindings.

Its principal features are:
  - bind, in a one-liner, callbacks to 'keydown' and 'keyup' events for specific keys
  - easy-to-remember and configurable key names _(instead of keycodes)_
  - complex 'press' events definition _(example: trigger a callback every 200ms after the key is pushed until its release)_
  - configurable key groupings _(example: 'Numeric' for numeric + numpad keys)_
  - automatic multi-layers propagation rules for complex UIs
  - easy to wrap in other libraries:
    - _'vanilla' js_: The principal implementation doesn't depend on any library and will work on any browser
    - _RxJS_: one of our default implementations can use your version of RxJS to transform inputs into an Observable stream
    - _React_: can be directly linked to React Components methods or props (WIP)
    - ...: you can use our createNewKeyboard function directly to easily link the RKeyboard to your specific architecture

> The RKeyboard was first integrated on TV platforms where every interactions, some complex, were done with the remote keys > (which were translated into KeyboardEvent's keycodes).

## Overview
```js
import RKeyboard from 'rkeyboard';

const keyboard = RKeyboard.create();

// simplest use case: listening to the 'Up' key and doing
// an alert when the key is pushed
keyboard('Up', { onPush: () => alert('Up pushed!') });
```
```js
//
const myKeys1 = keyboard(['Enter', 'Up', 'a'], {
  onPush: (evt) => {
    console.log('You pushed the key ${evt.keyName}');
  },
  onRelease: (evt) => {
    console.log('You released the key ${evt.keyName}');
  }
});

const myKeys2 = keyboard(['Enter', 'Up', 'a'], {
  // complex press usecase
  press: { after: 500, interval: 200 },

  onPush: (evt) => {
    console.log('You pushed the key ${evt.keyName}');
  },

  // press callback, triggered:
  //   1. after 500ms the keydown event happened (with no keyup)
  //   2. every 200ms after it (until the keyup)
  onPress: (evt) => {
    console.log('You pressed the key ${evt.keyName}');
  },
  
  // called on 'push' AND 'press'
  onDown: (evt) => {
    const event = evt.event;
    console.log('You  %s the key ${evt.keyName}',
      event === 'push' ? 'pushed' : 'pressed');
  }
});

// stop listening
myKeys2();
```

## Implementations

As the RKeyboard code is very modular, you can adapt it to any project very easily.
For example, with it you can easily react to keyboard inputs:
  - by using regular callbacks.
  - by directly triggering methods in React Components.
  - by using an event emitter.
  - by using RxJS observables (this was our default implementation)
  - ...

Multiple (minimal) implementations have already been written to save you the hassle and showcase what can be done in very few lines (I'm talking about less than 10 lines, watch our implementation's code in _src/implementations/_).

The current implementations are:
  - __Keyboard__: Minimal implementation. Register a unique callback for all types of events.
  - __SimpleKeyboad__: Add the possibility to add a callback by type of event.
  - __RxKeyboard__: Keyboard meant to be used with RxJS. Here your keyboard's stream of inputs can be treated as an observable.
  
### RKeyboard

The RKeyboard is the default implementation.

```js
import { RKeyboard } from 'rkeyboard';

// creating a SimpleKeyboard
const kb = RKeyboard.create();

// simply listening to the 'Enter', 'Up' and 'a' keys
kb('Enter', 'Up', 'a', pushCallback, releaseCallback);

// listen to key press event on Up key configured with `after` and
// `interval` options
kb('Up', { press: { after: 1000, interval: 2000 } },
  pushCallback,
  pressCallback, // note this was added here
  releaseCallback
);

// stop listening
kb('Up', { press: { after: 1000, interval: 2000 } },
  pushCallback,
  pressCallback, // note this was added here
  releaseCallback
);

// stop listening
const stopListening = kb(pushCallback, releaseCallback);
stopListening();
```
### MinimalKeyboar


### SimpleKeyboard

The SimpleKeyboard is an implementation of our rKeyboard meant to be simple to use for frequent usecases.

Each call of the simpleKeyboard function generates an object.
```js
import { SimpleKeyboard } from 'rkeyboard';

// creating a SimpleKeyboard
const kb = SimpleKeyboard.create();

console.log(typeof kb); // Function

// listening to new keys
const myKeys = kb('Enter', 'Left', 'a');

console.log(typeof myKeys); // Object

```
```js
import { SimpleKeyboard } from 'rkeyboard';

const kb = SimpleKeyboard.create();
const myKeys = kb('Enter', 'Left', 'a');

// catch 'push' events only (first keydown)
myKeys.onPush = (e) => {
 // 'push' here
 console.log(e.event);

 // 'Enter', 'Up' or 'Down' as they are the only keys listened to
 console.log(e.keyName);

 // Time the key has been pushed in ms (0 for 'push' event)
 console.log(e.timepress);

 // ...
};

// catch 'press' events (here, after 200ms of press)
myKeys.onPress = (e) => {
 // ...
};

// catch 'release' events (keyup)
myKeys.onRelease = (e) => {
 // ...
};

// catch every events (all 3 of them)
myKeys.onEvent = (e) => {
 // ...
};

// catch both push and press events
myKeys.onDown = (e) => {
 // ...
};

// stop listening to these keys
myKeys.stopListening();
```

To this object, you can add any of the 5 following properties:
  - __onEvent__: callback called as a 'push', 'press' or 'release' event is received.
  - __onPush__: callback called as a 'push' event is received.
  - __onPress__: callback called as a 'press' event is received.
  - __onRelease__: callback called as a 'release' event is received.
  - __onDown__: callback called as a 'push' or 'press' event is received.

Each of these callbacks will receive the same event object with, as usual, the following properties:
  - keyName: Name of the key pushed.
  - event: 'push', 'press' or 'release'
  - timepress: time the key was pressed (0 for a push event)

To remove the event listener, you can use the following method automatically added to this same object:
  - __stopListening__: stop catching the keys and stop triggering callbacks.


### RxKeyboard

The RxKeyboard can be used to connect the rKeyboard to the RxJS library.
This allows you to treat keyboard events an observable stream.

Each keyboard created from the RxKeyboard generate Observer functions compatible with most RxJS versions.
Its arguments are the same than for the other implementations (keys then options).

```js
import { RxKeyboard } from 'rkeyboard';
import rx from 'rxjs';

// Creating a new Keyboard
const kb = RxKeyboard.create();

// Catching keys with specific options
const observer = kb('Enter', 'Up', 'Down', { press: { after: 500 } });

console.log(typeof observer); // function

// our observer can be used in a rx.Observable through the
// create method.
const observable = rx.Observable.create(observer);

// here we can subscribe to it 
const subscription = observable.subscribe();

// as well as unsubscribe to stop triggering our callback and let
// the event propagate
subscription.unsubscribe();
```

#### Simple events

```js
import { RxKeyboard } from 'rkeyboard';
import rx from 'rxjs';

const kb = RxKeyboard.create();

/*
 * 1. Listening to a single Key
 */
rx.Observable.create(kb('Enter')).subscribe((key) => {
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
rx.Observable.create(kb('Left', 'Right')).subscribe((key) => {
  // the name of the key pressed. Here 'Left' or 'Right'
  const keyName = key.keyName;

  if (key.event === 'push')
    console.log(`${keyName} key pushed!`);
  else {
    console.log(`${keyName} key released!`);
});

/*
 * 3. Listening to a group of keys
 */
rx.Observable.create(kb('Directions')).subscribe((key) => {
  // the name of the key pressed. Here 'Left', 'Right'
  // 'Up' or 'Down'
  const keyName = key.keyName;

  if (key.event === 'push')
    console.log(`${keyName} key pushed!`);
  else {
    console.log(`${keyName} key released!`);
});

/*
 * 4. Listening to every keys declared
 */
rx.Observable.create(kb()).subscribe((key) => {
  if (key.event === 'push')
    console.log(`${keyName} key pushed!`);
  else {
    console.log(`${keyName} key released!`);
});
```

#### Press events

```js
import { RxKeyboard } from 'rkeyboard';
import rx from 'rxjs';

const kb = RxKeyboard.create();

/*
 * 1. Emit 'press' event after 500 ms if the key is pushed
 * without being released
 */
const options = {
  press: {
    after: 500
  }
};

rx.Observable.create(kb('Up', 'Down', options))
  // the 'press' event is added for our case
  .filter(e => e.event === 'press')
  .subscribe((key) => {
    console.log(`${keyName} key pressed for 500ms!`);
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

rx.Observable.create(kb('Up', 'Down', options))
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

rx.Observable.create(kb('Up', 'Down', options))
  .filter(e => e.event === 'press')
  .subscribe((key) => {
    const keyName = key.keyName;
    const timepress = key.timepress;
    console.log(`${keyName} key pressed for ${timepress}!`);
  });
```
#### Propagation rules

```js
import { RxKeyboard } from 'rkeyboard';
import rx from 'rxjs';

// added shortcut
const Obs = rx.Observable;

const kb = RxKeyboard.create();

// Here, we can take control of the key 'Enter' and 'End'.
const sub1 = Obs.create(kb('Enter', 'End'))
  .subscribe(() =>
    console.log(' I should receive both Enter and End here')
  );

// Here, we are the one taking the control of the key 'Enter'.
// sub1 will not receive events for 'Enter'.
// It will for 'End' though as we ignore this one.
const sub2 = Obs.create(kb('Enter'))
  .subscribe(() =>
    console.log('I\'m the only one to receive Enter')
  );

// By unsubscribing, we give back the control to sub1.
sub2.unsubscribe();

// Here, we set the propagate option to true.
// That way, both sub3 and sub1 receive events for the 'Enter'
// key.
const sub3 = Obs.create(kb('Enter', { propagate: true }))
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

// Declaring two rxKeyboard. Each has its own propagation layers.

const kb1 = RxKeyboard.create();
const kb2 = RxKeyboard.create();

Obs.create(kb('Enter')).subscribe(() => console.log('a'));

Obs.create(kb('Enter')).subscribe(() => console.log('b'));
Obs.create(kb('Enter')).subscribe(() => console.log('c'));
Obs.create(kb('Enter', { propagate: true }))
  .subscribe(() => console.log('d'));


// If we press the 'Enter' key, we get the following output:
// a
// d
// c
```

#### Configuration
```js
import { RxKeyboard } from 'rkeyboard';

// Replacing the default key map.
// Example: we want to distinguish numeric keys from the
// 'numeric pad' keys.
RxKeyboard.KEY_MAP = {
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
RxKeyboard.GROUPINGS = {
  Numeric: ['Num0', 'Num1'/*, ... */, 'Num9'],
  Numpad: ['Numpad0', 'Numpad1'/*, ... */, 'Numpad9']
};

// I want every Keyboard to propagate by default
RxKeyboard.DEFAULT_PROPAGATE_VALUE = true;

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
RxKeyboard.CONSECUTIVE_KEYDOWNS_INTERVAL = 500; // 500ms
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

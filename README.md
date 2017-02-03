# R-Keyboard

## Presentation

RKeyboard is a library allowing complex key handling in javascript.

Its main features are:
  - bind easily callbacks to keyboard events
  - bind complex 'press' events definition for when a key is maintained
  - manage automatic multi-layers propagation rules for complex UIs _(e.g. when a menu comes in front of your UI)_
  - easy-to-remember and configurable key names and key groupings _(example: 'Numeric' for numeric + numpad keys)_
  - easy to wrap in other libraries:
    - _'vanilla' js_: The principal implementation doesn't depend on any library and will work on most browsers.
    - _RxJS_: Our original implementation made use of RxJS Observables.
    - _React_: can be directly linked to React Components methods or props (wip).
    - _..._: you can use our createNewKeyboard function directly to easily link the RKeyboard to your specific architecture

I do not take the mouse position nor actions into account here, the RKeyboard was initially implemented for STB platforms where every possible interaction is done with the remote keys.

## Quick look

Let's present some general usecase, first:
```js
// import the RKeyboard from this libray
import RKeyboard from 'rkeyboard';

// create a new RKeyboard
const keyboard = RKeyboard();

// let's listen to keydown and keyup events for the 'Up' and 'Down' key
const myListener = keyboard.bind(['Up','Down'], {
  onPush: function(evt) {
    console.log(evt.keyName + ' pushed!'); // 'Up pushed!'/'Down pushed!'
  },

  onRelease: (evt) => {
    console.log(evt.keyName + ' released!'); // 'Up released!'/'Down released!'
  }
});

// unbind this specific interaction
myListener.unbind();

// adding press intervals to a key
const myPressListener = keyboard.bind('Right', {
  press: { after: 500, interval: 300 },

  onPress: function(evt) {
    console.log(`Right key pressed for ${evt.timepress} ms.`);
  }
});

// unbind all interaction linked with the current keyboard
keyboard.free();
```

## Installation

As of now, the RKeyboard is not on NPM (I want to finalize some testing first and be sure of the project's stability).

Build scripts to produce a single source is also a work in progress. For now, you can just import the RKeyboard from the ``src/index.js`` directory.
```js
import RKeyboard from './src';
```

## Keyboard creation

The first step to bind key events with the RKeyboard, is to create a new RKeyboard. This allows you to define the keys you want to catch and several other options.

This is done simply by executing the RKeyboard imported function.
```js
const keyboard = RKeyboard(options);
```

Here, 'options' is an optional object that can be given to the create function.
This object can contain any of the following properties:

| Name            | Type    | Description                                                   | Default value         |
|---------------- |---------|---------------------------------------------------------------|-----------------------|
| keyMap          | object  | Link event keyCodes to keyNames                               | See KeyMap chapter    |
| groupings       | object  | Aliases for several key names                                 | See Groupings chapter |
| preventDefault  | boolean | Used to automatically preventDefault on all the keyMap's keys | false                 |
| propagate       | boolean | Default propagation rule [3]                                  | true                  |
| reEmit          | number  | Default reEmitting time [4], in ms                            | 300                   |
| combine         | boolean | Wether multiple simultanate keypresses should be sent         | true                  |


This can seem complicated at first. A sane default configuration is already set by default, so you shouldn't have to worry about any of this yet.

Still, we will go through each of these options here.

### keyMap

The RKeyboard use keyNames (and not keyCodes) to know which key you want to bind to which callback.

The keyMap is the Object linking the keyCode (the object's keys) to the corresponding keyName (the object's values).

[A sane keyMap configuration is done by default](./KEY_MAP.md), but you might want to set yours.
This can be done through the _keyMap_ options when creating a new RKeyboard:

```js
const myKeyboard = RKeyboard({ keyMap: { 13: 'Enter' } });
```

### groupings

Groupings are, as its name may hint at, grouping of multiple keys.
This can be used to easily refer to multiple keys (like the direction keys).

Let's say that you want to write an editor which just print every letter you type in. You already recorded the keyNames corresponding to every letter through the keyMap ('a' for the letter a etc.). You might want to add a ``'letters'`` grouping for every letter keys (already present in the default groupings configuration) and just do:

```js
const myKeyboard = RKeyboard();

myKeyboard.bind('letters', {
  onPush({ keyName }) {
    writeLetter(keyName);
  }
})
```

And that's it! The ``keyName`` attribute will be as usual the keyName configured for the keyCode the user typed. So in this case, it can be any letter configured in the ``'letters'`` grouping.

The groupings options is just an object with, as a key, the name of the grouping, and as a value, the array of every keyNames it regroups.

[A sane groupings configuration is done by default](./GROUPINGS.md), but you might want to set yours.
This can be done through the _groupings_ options when creating a new RKeyboard:

```js
const myKeyboard = RKeyboard({ groupings: { directions: ['Left', 'Down', 'Right', 'Up' ] } });
```

### preventDefault

If set to true, the preventDefault option will automatically, at the RKeyboard creation, perform a preventDefault to every keydown and keyup events for every key written in the keyMap.

TODO also prevent keypress?

This can be useful when binding keys already used by the browser, such as the F5 key.

It is set to false by default (no preventDefault). If you want to set it, just set the __preventDefault__ option to true when creating a new RKeyboard.
```js
const myKeyboard = RKeyboard({ preventDefault: true });
```

### propagate

The propagation management is one of the main advantage of using the RKeyboard. It is used to prevent specific keys to be binded to multiple simultaneous component (or not, depending on the usecase). Don't be afraid, it might seem complicated but it's really simple in practice.

TODO

### reEmit

The reEmit option also shines in complex UIs where multiple component can mount and unmount during the lifetime of your applications. Basically, it allows to reEmit a keydown even if the key was pushed when another binder was active.

Let's illustrate this with a simple example:

TODO

### combine

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

TODO

To this object, you can define any of the following handler functions:
  - __onPush__: callback called when a 'push' event is received.
  - __onRelease__: callback called when a 'release' event is received.
  - __onPress__: callback called when a 'press' event is received.
  - __onEvent__: callback called when a 'push', 'press' or 'release' event is received.
  - __onDown__: callback called when a 'push' or 'press' event is received.
  - __onUnbind__: callback called just before the handler in unbound.

Each of these callbacks will receive the same event object with, as usual, the following properties:
  - keyName: Name of the key pushed.
  - event: 'push', 'press' or 'release'
  - timepress: time the key was pressed (0 for a push event)

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

## TODOS
- README
- Rewrite functional tests
- Add key combination (ordered or not)?

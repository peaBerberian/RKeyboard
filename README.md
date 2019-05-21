# RKeyboard ####################################################################

## Overview ####################################################################

The RKeyboard is a library allowing complex key handling in javascript.

With it, you can:
  - bind callbacks to keyboard events
  - bind 'press' events triggered when a key is maintained for a configurable
    amount of time
  - manage multi-layers propagation rules for complex UIs _(e.g. to allow or not
    multiple event handler at the same time when multiple key-grabbing menus are
    on the screen)_
  - allow to re-emit (or not) a given key event when registering a callback for
    it while the key is already pressed
  - easy-to-remember, configurable key names and key groupings _(example:
    'Numeric' for numeric + numpad keys)_
  - easy to integrate to other libraries

The RKeyboard was initially implemented for complex set-top box applications
where every interaction has to be done with the remote keys.



## Quick Example ###############################################################

Here is a basic usage of RKeyboard:
```js
// import the RKeyboard from this libray
import RKeyboard from 'rkeyboard';

// create a new RKeyboard
const keyboard = RKeyboard();

// let's listen to keydown and keyup events for the 'Up' and 'Down' key
const upOrDown = keyboard.bind(['Up','Down'], {
  onPush: function(evt) {
    console.log(evt.keyName + ' pushed!'); // 'Up pushed!' (or Down pushed!')
  },

  onRelease: (evt) => {
    console.log(evt.keyName + ' released!'); // 'Up released!'
                                             // (or 'Down released!')
  }
});

// Stop listening to those events
upOrDown.unbind();

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



## Installation ################################################################

The RKeyboard is not available on `npm` yet, I still have to fix some edge-cases
before publishing it.

In the meantime you can freely use the code in this repository.



## Usage #######################################################################

The first step before listening to key events is to create a new RKeyboard.
```js
const keyboard = RKeyboard();
```


### Basic binding (push/release key) ###########################################

The next step is to call `bind` on it, allowing to listen to given key(s):
```js
const upOrDown = keyboard.bind(['Up', 'a'], {
  onPush: function(evt) {
    if (evt.keyName === 'a') {
      console.log('The `a` key was pushed!');
    } else {
      console.log('The `Up` key was pushed!');
    }
  },

  onRelease: (evt) => {
    console.log(evt.keyName + ' released!'); // 'Up released!'
                                             // (or 'Down released!')
  }
});
```

The first argument given to bind is an array of strings corresponding to the
names of the key wanted. It can have any number of element.

The list of available key names is declared [here](./doc/KEY_MAP.md).
You can also declare your own list of keys, see [the advanced configuration
page](./doc/advanced_usages.md) for more informations.

As a second argument, you can define an object with any of the following handler
functions:
  - __onPush__: callback called when a 'push' event is received (equivalent to a
    "keydown" event).
  - __onRelease__: callback called when a 'release' event is received
    (equivalent to a "keyup" event).
  - __onPress__: callback called when a 'press' event is received (see below).
  - __onEvent__: callback called when a 'push', 'press' or 'release' event is
    received.
  - __onDown__: callback called when a 'push' or 'press' event is received.
  - __onUnbind__: callback called just before the handler in unbound.

Each of these callbacks will receive the same event object with, as usual, the
following properties:
  - keyName (`string`): Name of the key pushed.
  - event (`string`): `'push'`, `'press'` or `'release'`
  - timepress (`number`): time the key was pressed (0 for a push event), in
    milliseconds

You can call `unbind` to stop listening to those keys when you're done:
```js
upOrDown.unbind();
```


### Declaring press events ####################################################

A more advanced use case can be to handle "press events".

Press events happen when the user pushed a key for a certain amount of time.
Passed that time, those events can be re-sent at a certain interval.

Both of those timer (from which time we "press" and at which interval we repeat)
are configurable.

Examples will be more explicit here:
```js

// 1. Emit 'press' event after 500 ms if the key is pushed without being
// released
keyboard.bind(['Up', 'Down'], {
  press: { // <- added the press property
    after: 500 // <- begin press event after 500 milliseconds
  },

  onPress(evt) { // <- handler function, same as before
    console.log(`The key ${evt.keyName} was pressed for 500 ms!`);

    console.log(evt.timepress); // should be equal to `500` (or almost 500)
  }

  // ... (onPush etc are still usable here)
});

// 2. Emit 'press' events EVERY 500 ms while the key is pushed without being
// released
keyboard.bind(['Up', 'Down'], {
  press: {
    interval: 500
  },

// 3. Emit 'press' events:
//      1. AFTER 500ms as the key is pushed without being released
//      2. EVERY 200ms after that (until the release)
keyboard.bind(['Up', 'Down'], {
  press: {
    after: 500
    interval: 200
  },

  // ...
});
```


### Propagation rules ##########################################################

An even more advanced usage are what we call "propagation rules".

By default, when a second handler bind to the same keys than a first handler,
the first handler will not be called for those keys anymore until the second
one is "unbound".

Chances are, that's what you want in most cases.

There could still be cases were you still want the handler declared before you
have control.

That's what propagation rules are for. Again, let's show a simple example:
```js
// Take control of the key 'Enter' and 'End'.
const bind1 = keyboard.bind(['Enter', 'End'], {
  // ...
});

// Here, we take control of the key 'Enter' again.
// bind1 event handlers will not receive events for the 'Enter' key.
// It will for 'End' though as we ignore this one.
const bind2 = keyboard.bind(['Enter'], {
  // ...
});

// By unbinding bind2, bind1 is notified again when the 'Enter' key is pressed.
bind2.unbind();

// Here, we set the propagate option to true.
// That way, both bind3 and bind1 receive events for the 'Enter' key.
const bind3 = keyboard.bind(['Enter'], {
  propagate: true,
  // ...
});

// NOTE: We can put as many propagation level as we want.
//
// Example: bind55 propagate a key to bind54 which propagate to bind53
// which does NOT propagate to bind52.
// In this case, bind52 will receive the event only if bind55, bind54
// AND bind53 are not binded anymore.
// This can go on and on to bind1 with multiple layer of propagations.

// Note: By declaring two RKeyboard, each will have their own propagation
// layers.

const kb1 = RKeyboard();
const kb2 = RKeyboard();

kb1.bind(['Enter'], {
  onPush: () => { console.log('a'); }
});
kb2.bind(['Enter'], {
  onPush: () => { console.log('b'); }
});
kb2.bind(['Enter'], {
  onPush: () => { console.log('c'); }
});
kb1.bind(['Enter'], {
  propagate: true, // <- Note the propagate here
  onPush: () => { console.log('d'); }
});


// If we press the 'Enter' key, we should get the following output:
// a
// c
// d
```


### Reemit logic ###############################################################

Another advanced concept is the possibility to re-emit a key event when the key
was already pushed when the binding was done.

This can be for example useful when the key in question caused the corresponding
binding.

Let's take the following example:
```js
const keyboard = RKeyboard();

keyboard.bind(['Enter'], {
  onPush() {
    openMenu();
  }
});

function openMenu() {
  keyboard.bind(['Enter'], {
    onPush() {
      // selectMenuEntry();
    }
  });

  // displayMenu();
  // ...
}
```

Here pushing the "Enter" key will directly display a menu also grabbing the
Enter key. That's not much of a problem but if the user doesn't let go of that
key, the second binding will never know it has been pushed.

From there, you could either:
  1. think that if the user doesn't let go of that key, its intent is surely
     to click it again.
  2. think that's normal, if the user wants to tell us 'Enter' again, he/she
     should just re-click on it 

If you're on the first case, you're in luck! That's the default behavior.

By default, the corresponding "push" event is re-emitted 500 milliseconds after
the binding is done if the key is still pressed. The corresponding "press"
events (if you specified them) will then start from that milestone.

That 500 milliseconds delay is easily configurable thanks to the `reEmit`
option:
```js
keyboard.bind(['Enter'], {
  reEmit: 1000, // if the enter key was already pushed, wait 1 second. If
                // the key is still not released after it, re-send push event.
  onPush() {
    console.log('Enter key was either pushed or maintained for at least 1s!');
  }
```

If you're in the second case (you don't want to reEmit), that's still possible.
Just set the `reEmit` option to -1:
```js
keyboard.bind(['Enter'], {
  reEmit: -1, // Disable the reEmit logic
  onPush() {
    console.log('Enter key was pushed!');
  }
```

Related note: the "release" event is not received from binding which didn't
received the corresponding "push" event. That was done on purpose because it was
seen as a sane behavior. Please open an issue if you don't think that's the
case.

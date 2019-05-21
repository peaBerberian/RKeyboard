# Advanced usages ##############################################################

## RKeyboard options ###########################################################

When creating a new RKeyboard, you can pass multiple options in arguments:
```js
const keyboard = RKeyboard(options);
```

Here, `options` is an (optional) object which can contain any of the following
properties:

| Name          | Type    | Description                                           | Default value         |
|---------------|---------|-------------------------------------------------------|-----------------------|
| keyMap        | object  | Link event keyCodes to keyNames                       | See KeyMap chapter    |
| groupings     | object  | Aliases for several key names                         | See Groupings chapter |
| preventDefault| boolean | call preventDefault on all the keyMap's keys          | false                 |
| propagate     | boolean | Default propagation rule                              | true                  |
| reEmit        | number  | Default reEmitting time, in ms                        | 300                   |
| combine       | boolean | Wether multiple simultanate keypresses should be sent | true                  |


This can seem complicated at first but rest assured, a sane configuration is
already set by default.


### keyMap #####################################################################

The RKeyboard use key names (and not keyCodes) to know which key you want to
bind to which callback.

The keyMap is the Object linking the keyCode to the orresponding keyName.

[A sane keyMap configuration is done by default](./KEY_MAP.md), but you might
want to set yours instead.
This can be done through the _keyMap_ options when creating a new RKeyboard:

```js
const myKeyboard = RKeyboard({
  keyMap: {
    13: 'Enter' // keyCode: keyName
    37: 'Left',
    38: 'Up',
    39: 'Right',
    40: 'Down',
    // ...
  }
});
```


### groupings ##################################################################

Groupings are, as its name may hint at, grouping of multiple keys.
This can be used to easily refer to multiple keys (like the direction keys).

Let's say that you want to write an editor which just print every letter you
type in. You already recorded the keyNames corresponding to every letter through
the keyMap ('a' for the letter a etc.).
You might want to add a ``'letters'`` grouping for every letter keys and just
do:
```js
const myKeyboard = RKeyboard();

myKeyboard.bind('letters', {
  onPush({ keyName }) {
    writeLetter(keyName);
  }
})
```

And that's it! The ``keyName`` attribute will be as usual the keyName configured
for the keyCode the user typed. So in this case, it can be any letter configured
in the ``'letters'`` grouping.

The groupings options is just an object with, as a key, the name of the
grouping, and as a value, the array of every keyNames it regroups.

[A sane groupings configuration is done by default](./GROUPINGS.md), but you
might want to set yours.

This can be done through the _groupings_ options when creating a new RKeyboard:
```js
const myKeyboard = RKeyboard({
  groupings: {
    directions: ['Left', 'Down', 'Right', 'Up' ]
  }
});
```


### preventDefault #############################################################

If set to true, the preventDefault option will automatically, at the RKeyboard
creation, perform a preventDefault to every keydown and keyup events for every
key written in the keyMap.

It is set to false by default (no preventDefault).

If you want to set it, just set the __preventDefault__ option to true when
creating a new RKeyboard.
```js
const myKeyboard = RKeyboard({ preventDefault: true });
```

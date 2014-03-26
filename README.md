# quicksound.js

A very simple JavaScript sound library using the Web Audio API and a fallback to flash.

To use this library, download the minified (or non-minified) JS in the release directory, as well as the swf file which must be placed next to the HTML in which you include the JS.

## Example

```js
quicksound.create(function() {
  quicksound.load({
    path: 'sound.mp3',
    doneFunc: function(_, sound) {
      quicksound.play(sound);
    },
    errorFunc: function() {
      console.log('Failed to load sound');
    }
  });
});
```

## Usage

### quicksound.create(doneFunc, errorFunc)

This initializes the quicksound library. If WebAudio is available, that will be used, otherwise a flash fallback will be used. If the library is successfully initialized, doneFunc will be called, otherwise errorFunc will be called. 

Before the create function is called, the other functions are not available.

### quicksound.bestFormat(formats)

Checks for the browser support of different audio formats. Pass an array of formats (using the common file extensions) and bestFormat will return the first supported one, or null if none is supported. If the flash fallback is used, only mp3 will be supported.

```js
quicksound.bestFormat(['aac','ogg','mp3','wav'])
// -> 'ogg'
```

### quicksound.load(options)

This loads one or more sounds from specified paths. The options object is expected to contain the following properties:

* **path** or **paths**: a string, array or object that defines where to load the sounds from.
* **doneFunc**: callback when all sounds are successfully loaded. Parameters are the options object and result object.
* **errorFunc**: callback if one or more sounds were not successfully loaded. Parameters are the options object and if at least one sound was successfully loaded the result object.

Optional options:

* **extension**: the file extension to use for each given path
* **retries**: the number of times the libary will retry loading the resource from the server (default 3)

See the examples for usage:

```js
quicksound.load({
  path: 'laser.ogg',
  doneFunc: function(options, sound) {},
  errorFunc: function(options) {}
});
// doneFunc will get a single sound object

quicksound.load({
  path: [ 'laser.ogg', 'boom.ogg' ],
  doneFunc: function(options, result) {},
  errorFunc: function(options, result) {}
});
// doneFunc will get an object in the form: { 'laser.ogg': sound1, 'boom.ogg': sound2 }

quicksound.load({
  path: { shot: 'laser', explosion: 'boom' },
  extension: '.ogg',
  doneFunc: function(options, result) {},
  errorFunc: function(options, result) {}
});
// doneFunc will get an object in the form: { 'shot': sound1, 'explosion': sound2 }
```

### quicksound.play(sound, [offset, loop])

This plays a given sound. Optional parameters are the offset (in seconds) and a boolean if the sound should loop.

### quicksound.stop(sound)

Stop playing a particular sound

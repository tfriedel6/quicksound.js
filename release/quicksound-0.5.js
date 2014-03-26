var quicksound = {};

(function () {
    quicksound.create = function (doneFunc, errorFunc) {
        var audioContext = null;
        try {
            audioContext = new AudioContext();
        } catch (e) {
            try {
                audioContext = new webkitAudioContext();
            } catch (e) {
            }
        }
        if (audioContext != null) {
            quicksound.getBestAudioFormat = webAudioGetBestAudioFormat;
            quicksound.loader = function (options) {
                return loader(audioContext, options, webAudioCreateSingleLoader);
            };
            quicksound.load = function (options) {
                quicksound.loader(options)();
            };
            quicksound.play = function (sound, offset, loop) {
                webAudioPlay(audioContext, sound, offset, loop);
            };
            quicksound.stop = webAudioStop;
            setTimeout(doneFunc, 1);
        } else {
            flashCreateAudioContext(function(flashAudioContext) {
                if (flashAudioContext != null) {
                    quicksound.getBestAudioFormat = flashGetBestAudioFormat;
                    quicksound.loader = function (options) {
                        return loader(flashAudioContext, options, flashCreateSingleLoader);
                    };
                    quicksound.load = function (options) {
                        quicksound.loader(options)();
                    };
                    quicksound.play = function (sound, offset, loop) {
                        flashPlay(flashAudioContext, sound, offset, loop);
                    };
                    quicksound.stop = function (sound) {
                        flashStop(flashAudioContext, sound);
                    };
                    doneFunc();
                } else {
                    errorFunc();
                }
            });
        }
    };

    function webAudioGetBestAudioFormat(fromFormats) {
        if (Audio) {
            if (!fromFormats) {
                fromFormats = [ 'webm', 'ogg', 'aac', 'mp3', 'wav', 'aif' ];
            }
            var firstMaybe = null;
            for (var i in fromFormats) {
                if (fromFormats.hasOwnProperty(i)) {
                    var format = fromFormats[i];
                    var support = getAudioFormatSupport(format);
                    if (support == 'probably') {
                        return format;
                    } else if (firstMaybe == null && support == 'maybe') {
                        firstMaybe = format;
                    }
                }
            }
            return firstMaybe;
        }
        return null;

        function getAudioFormatSupport() {
            if (Audio) {
                var audio = new Audio();
                if (audio.canPlayType) {
                    format = format.toLowerCase();
                    if (format.indexOf('ogg') >= 0) {
                        return audio.canPlayType('audio/ogg; codecs="vorbis"');
                    } else if (format.indexOf('mp3') >= 0) {
                        return audio.canPlayType('audio/mpeg');
                    } else if (format.indexOf('aac') >= 0) {
                        return audio.canPlayType('audio/aac') || audio.canPlayType('audio/x-m4a');
                    } else if (format.indexOf('wav') >= 0) {
                        return audio.canPlayType('audio/wav');
                    } else if (format.indexOf('aif') >= 0) {
                        return audio.canPlayType('audio/aiff') || audio.canPlayType('audio/x-aiff');
                    } else if (format.indexOf('webm') >= 0) {
                        return audio.canPlayType('audio/webm');
                    }
                }
            }
            return false;
        }
    }

    function loader(audioContext, options, createSingleLoaderFunc) {
        if (options.paths != null) {
            options.path = options.paths;
        }
        if (options == null || options.path == null || options.doneFunc == null || options.errorFunc == null) {
            return null;
        }
        var extension = options.extension == null ? "" : options.extension;
        if (typeof(options.path) == 'string') {
            return createSingleLoaderFunc(audioContext, options.path + extension, options);
        } else {
            var loaders = [];
            var successCount = 0, errorCount = 0;
            var result = {};

            function doneFunc(options, audioBuffer) {
                result[options.id] = audioBuffer;
                successCount++;
                checkEnd();
            }

            function errorFunc() {
                errorCount++;
                checkEnd();
            }

            function checkEnd() {
                if (successCount + errorCount == loaders.length) {
                    if (errorCount > 0) {
                        options.errorFunc(options, result);
                    } else if (successCount == loaders.length) {
                        options.doneFunc(options, result);
                    }
                }
            }

            if (isArray(options.path)) {
                for (var i = 0; i < options.path.length; i++) {
                    loaders.push(makeLoader(options.path[i], options.path[i]));
                }
            } else {
                for (var id in options.path) {
                    if (options.path.hasOwnProperty(id)) {
                        loaders.push(makeLoader(options.path[id], id));
                    }
                }
            }
            function makeLoader(path, id) {
                return createSingleLoaderFunc(audioContext, path + extension, {
                    retries: options.retries,
                    id: id,
                    doneFunc: doneFunc,
                    errorFunc: errorFunc
                });
            }

            return function () {
                for (var i = 0; i < loaders.length; i++) {
                    loaders[i]();
                }
            }
        }
    }

    function webAudioCreateSingleLoader(audioContext, path, options) {
        if (options.retries == null) options.retries = 3;
        return function () {
            if (XMLHttpRequest && audioContext && audioContext.decodeAudioData) {
                var retries = 0;

                function startRequest() {
                    var request = new XMLHttpRequest();
                    request.open('GET', path, true);
                    request.responseType = 'arraybuffer';

                    request.addEventListener('load', function () {
                        try {
                            audioContext.decodeAudioData(request.response, function (audioBuffer) {
                                if (options.doneFunc) options.doneFunc(options, audioBuffer);
                            }, function () {
                                error();
                            });
                        } catch (e) {
                            error();
                        }
                    });
                    request.addEventListener("error", requestError);
                    request.addEventListener("abort", requestError);
                    request.send();
                }

                function requestError() {
                    if (retries++ < options.retries) {
                        setTimeout(function () {
                            startRequest();
                        }, 1000);
                    } else {
                        error();
                    }
                }

                startRequest();
            } else {
                error();
            }

            function error() {
                options.errorFunc(options);
            }
        }
    }

    function webAudioPlay(audioContext, sound, offset, loop) {
        if (audioContext) {
            var source = audioContext.createBufferSource();
            source.buffer = sound;
            source.connect(audioContext.destination);
            source.loop = loop;
            if (source.start) {
                source.start(0, offset);
            } else if (source.noteOn && !offset) {
                source.noteOn(0);
            }
            sound.currentSourceNode = source;
            sound.startTime = now();
        }
    }

    function webAudioStop(sound) {
        delete sound.resumePosition;
        if (sound.currentSourceNode) {
            if (sound.currentSourceNode.stop) {
                sound.currentSourceNode.stop(0);
            } else if (sound.currentSourceNode.noteOff) {
                sound.currentSourceNode.noteOff(0);
            }
            sound.currentSourceNode = null;
        }
    }

    // ------------------------------------------------------------------------------------

    function flashCreateAudioContext(callback) {
        createContext();
        var fullTries = 4;
        checkForContext(6);
        function createContext() {
            document.getElementById('audioSWF').innerHTML = '<object id="audioSWF1" width="1" height="1">' +
                '<param name="movie" value="quicksound.swf">' +
                '<embed id="audioSWF2" src="quicksound.swf" width="1" height="1"></embed>' +
                '</object>';
        }

        function checkForContext(tries) {
            if (tries > 0) {
                setTimeout(function () {
                    var context = document.getElementById('audioSWF1');
                    if (context && context.isAvailable && context.isAvailable()) {
                        callback(context);
                    } else {
                        context = document.getElementById('audioSWF2');
                        if (context && context.isAvailable && context.isAvailable()) {
                            callback(context);
                        } else {
                            checkForContext(tries - 1);
                        }
                    }
                }, 100);
            } else {
                document.getElementById('audioSWF').removeChild(document.getElementById('audioSWF1'));
                if (fullTries-- > 0) {
                    createContext();
                    checkForContext(6);
                } else {
                    callback(null);
                }
            }
        }
    }

    function flashGetBestAudioFormat(fromFormats) {
        for (var i = 0; i < fromFormats.length; i++) {
            if (fromFormats[i].toLowerCase().indexOf('mp3') != -1) {
                return fromFormats[i];
            }
        }
        return null;
    }

    function flashCreateSingleLoader(audioContext, path, options) {
        return function () {
            var retries = 0;
            attemptLoad();
            function attemptLoad() {
                var audioBuffer = audioContext.loadSound(path);
                checkForSound(200);
                function checkForSound(tries) {
                    if (tries > 0) {
                        setTimeout(function () {
                            if (audioContext.isLoaded(audioBuffer)) {
                                options.doneFunc(options, audioBuffer);
                            } else if (audioContext.isError(audioBuffer)) {
                                options.errorFunc(options);
                            } else {
                                checkForSound(tries - 1);
                            }
                        }, 50);
                    } else {
                        if (retries++ < options.retries) {
                            setTimeout(function () {
                                attemptLoad();
                            }, 1000);
                        } else {
                            options.errorFunc(options);
                        }
                    }
                }
            }
        };
    }

    function flashPlay(audioContext, id, offset, loop) {
        if (audioContext) {
            audioContext.playSound(id, offset, loop);
        }
    }

    function flashStop(audioContext, sound) {
        delete sound.resumePosition;
        audioContext.stopSound(sound.audioBuffer);
    }

    var isArray = Array.isArray ? Array.isArray : function (arg) {
        return Object.prototype.toString.call(arg) === "[object Array]";
    };

    var now = Date.now ? Date.now : function () {
        return new Date().valueOf();
    };
})();
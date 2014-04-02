#!/bin/sh
. ./build.config
VERSION=$(cat ../js-src/quicksound.js | grep -A2 "quicksound.version = function()" | grep return | sed 's/.*\([0-9]\.[0-9]\+\.[0-9]\+\).*/\1/')
cp ../js-src/quicksound.js ../release/quicksound-$VERSION.js
${JDK_BIN_PATH}java -jar $CLOSURE_COMPILER_PATH --js_output_file=../release/quicksound-$VERSION-min.js --js=../js-src/quicksound.js
${AIR_SDK_BIN_PATH}amxmlc -output=../release/quicksound-$VERSION.swf ../air-src/FlashSound.as

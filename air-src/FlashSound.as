package {

    import flash.display.Sprite;
    import flash.events.Event;
    import flash.events.IOErrorEvent;
    import flash.external.ExternalInterface;
    import flash.media.Sound;
    import flash.net.URLRequest;

    [SWF(width=1, height=1, frameRate=60, backgroundColor='#000000')]
    public class FlashSound extends Sprite {
        [Embed(source="silence.mp3")]
        private static var silenceSoundClass:Class;
        private static const silenceSound:Sound = new silenceSoundClass();

        private var sounds:Array = [];

        public function FlashSound() {
            if( ExternalInterface.available ) {
                ExternalInterface.addCallback( 'isAvailable', isAvailable );
                ExternalInterface.addCallback( 'loadSound', loadSound );
                ExternalInterface.addCallback( 'isLoaded', isLoaded );
                ExternalInterface.addCallback( 'isError', isError );
                ExternalInterface.addCallback( 'playSound', playSound );
                ExternalInterface.addCallback( 'stopSound', stopSound );
            }
            silenceSound.play( 0, int.MAX_VALUE );
        }

        private static function isAvailable():Boolean {
            return true;
        }

        private function loadSound( url:String ):int {
            for( var i:int = 0; i < sounds.length; i++ ) {
                if( sounds[i].url == url ) {
                    return i;
                }
            }
            var soundInfo:* = {
                url: url,
                sound: null,
                error: false,
                soundChannel: null
            };
            var index:int = sounds.length;
            sounds.push( soundInfo );

            var s:Sound = new Sound();
            s.addEventListener( Event.COMPLETE, onSoundLoaded );
            s.addEventListener( IOErrorEvent.IO_ERROR, onSoundLoadError );
            s.load( new URLRequest( url ) );
            function onSoundLoaded( event:Event ):void {
                soundInfo.sound = event.target as Sound;
            }

            function onSoundLoadError():void {
                soundInfo.error = true;
            }

            return index;
        }

        private function isLoaded( id:int ):Boolean {
            return sounds[id] && sounds[id].sound;
        }

        private function isError( id:int ):Boolean {
            return sounds[id] && sounds[id].error;
        }

        private function playSound( id:int, offset:Number, loop:Boolean ):void {
            if( isLoaded( id ) ) {
                stopSound( id );
                sounds[id].soundChannel = sounds[id].sound.play( offset * 1000, loop ? int.MAX_VALUE : 0 );
            }
        }

        private function stopSound( id:int ):void {
            if( isLoaded( id ) && sounds[id].soundChannel ) {
                sounds[id].soundChannel.stop();
                sounds[id].soundChannel = null;
            }
        }
    }
}

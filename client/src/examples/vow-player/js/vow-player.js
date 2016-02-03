//Prepare config
var config = new Configuration();

//Video width resolution
config.videoWidth = 320;

//Video height resolution
config.videoHeight = 240;

//Web Call Server Websocket URL
var url = "ws://192.168.1.5:8080";

//The stream name can be an RTSP URL for playback
//Example: rtsp://192.168.1.5:1935/live/stream1
var streamName;

//The streamName can be also WebRTC stream ID. Example:
//var streamName = "XP34dq6aqJK0V09o5RbU";

//Get API instance
var f = Flashphoner.getInstance();

//get player instance
var wsPlayer;

//Current stream
var stream = {};

function initOnLoad() {
    //add listeners
    f.addListener(WCSEvent.ErrorStatusEvent, errorEvent);
    f.addListener(WCSEvent.ConnectionStatusEvent, connectionStatusListener);
    f.addListener(WCSEvent.StreamStatusEvent, streamStatusListener);
    f.addListener(WCSEvent.OnBinaryEvent, binaryListener);
    f.init();

    //create player
    var canvas = document.getElementById('videoCanvas');
    wsPlayer = new WebsocketPlayer(canvas, function(e){
            if (e.unmute != undefined) {
                if (this.stream.status == StreamStatus.Paused) {
                    f.playStream(this.stream);
                    console.log("Request stream back");
                    onPlaying();
                }
            } else if (e.mute != undefined) {
                if (this.stream.status == StreamStatus.Playing) {
                    f.pauseStream(this.stream);
                    console.log("pauseStream");
                    onPaused();
                }
            }
        }.bind(this),
        function (str) {
            this.writeInfo(str);
        }.bind(this)
    );
    wsPlayer.init(config);

    //connect to server
    f.connect({
        urlServer: url,
        appKey: "defaultApp",
        useWsTunnel: true,
        useBase64BinaryEncoding: false,
        width: config.videoWidth,
        height: config.videoHeight
    });
}

///////////////////////////////////////////
//////////////Listeners////////////////////
function connectionStatusListener(event) {
    console.log(event.status);
    if (event.status == ConnectionStatus.Established) {
        console.log('Connection has been established. Press Play to get stream.');
        writeInfo("CONNECTED, press play");
    } else if (event.status == ConnectionStatus.Disconnected) {
        wsPlayer.stop();
        console.log("Disconnected");
        writeInfo("DISCONNECTED");
    } else if (event.status == ConnectionStatus.Failed) {
        wsPlayer.stop();
        writeInfo("CONNECTION FAILED");
        f.disconnect();
    }
}

function binaryListener(event) {
    wsPlayer.onDataReceived(event);
}

//Connection Status
function streamStatusListener(event) {
    console.log(event.status);
    if (event.status == StreamStatus.Failed) {
        wsPlayer.stop();
    } else if (event.status == StreamStatus.Stoped) {
        wsPlayer.stop();
    } else if (event.status == StreamStatus.Playing){
        onPlaying();
    } else if (event.status == StreamStatus.Paused){
        onPaused();
    }
    writeInfo("Stream " + event.status);
    this.stream.status = event.status;
}

//Error
function errorEvent(event) {
    console.log(event.info);
    wsPlayer.stop();
}
//////////////////////////////////////////

function playFirstSound() {
    wsPlayer.playFirstSound();
}

function playStream() {
    //play a sound to enable mobile loudspeakers
    playFirstSound();
    var stream = new Stream();
    stream.name = document.getElementById("streamId").value;
    stream.hasVideo = true;
    stream.mediaProvider = MediaProvider.Flash;
    stream.sdp = "v=0\r\n" +
    "o=- 1988962254 1988962254 IN IP4 0.0.0.0\r\n" +
    "c=IN IP4 0.0.0.0\r\n" +
    "t=0 0\r\n" +
    "a=sdplang:en\r\n"+
    "m=video 0 RTP/AVP 32\r\n" +
    "a=rtpmap:32 MPV/90000\r\n" +
    "a=recvonly\r\n" +
    "m=audio 0 RTP/AVP 0\r\n" +
    "a=rtpmap:0 PCMU/8000\r\n" +
    "a=recvonly\r\n";
    this.stream = f.playStream(stream);
}

function writeInfo(str) {
    var div = document.getElementById('infoDiv');
    div.innerHTML = div.innerHTML + str + "<BR>";
}

function onPlaying(){
    $("#controlButton").removeClass("playButton");
    $("#controlButton").addClass("pauseButton");
    $(".control").click(function () {
        wsPlayer.pause();
    });
}

function onPaused(){
    $("#controlButton").removeClass("pauseButton");
    $("#controlButton").addClass("playButton");
    $(".control").click(function () {
        wsPlayer.resume();
    });
}

$(document).ready(function () {
    $("#controlButton").addClass("playButton");
    $(".control").click(function () {
        if (stream.status != undefined && stream.status != StreamStatus.Stoped) {
            return;
        }
        playStream();
    });
});
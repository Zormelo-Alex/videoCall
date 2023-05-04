const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const startButton = document.getElementById('start-call');
const endButton = document.getElementById('end-call');
 
let localStream;
let remoteStream;
let peerConnection;
let socket;
 
startButton.onclick = startCall;
endButton.onclick = endCall;
 
function startCall() {
  console.log('Starting call...');
 
  const serverUrl = 'ws://' + window.location.hostname + ':5000';
  const socket = new WebSocket(serverUrl);
 
  socket.addEventListener('open', function(event) {
    console.log('WebSocket connection opened:', event);
    alert("WebSocket connection opened: ...")
 
    const offer = peerConnection.createOffer();
    //console.log(offer)
 
    peerConnection.setLocalDescription(offer).then(function() {
      const message = {
        type: 'offer',
        payload: offer,
      };
 
      console.log('Sending offer:', message);
 
      try {
        socket.send(JSON.stringify(message));
      } catch (error) {
        console.error("Error sending message: ", error);
      }
      
    });
  });
 
  socket.addEventListener('message', function(event) {
    console.log('Received message from server:', event);
 
    const message = JSON.parse(event.data);
 
    switch (message.type) {
      case 'answer':
        handleAnswerMessage(message.payload);
        break;
      case 'icecandidate':
        handleIceCandidateMessage(message.payload);
        break;
      default:
        console.error('Unknown message type:', message.type);
        break;
    }
  });
 
  socket.addEventListener('close', function(event) {
    console.log('WebSocket connection closed:', event);
    alert('WebSocket connection closed: ...')
  });
}
 
function endCall() {
  localStream.getTracks().forEach(track => track.stop());
  remoteStream.getTracks().forEach(track => track.stop());
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
  peerConnection.close();
  peerConnection = null;
}
 
async function handleConnection(event, socket) {
  if (event.candidate) {
    const message = JSON.stringify({
      type: 'icecandidate',
      data: event.candidate,
    });
    socket.send(message);
  }
}

 
function handleTrack(event) {
  remoteStream = event.streams[0];
  remoteVideo.srcObject = remoteStream;
}

async function handleOffer(offer) {
  try {
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    peerConnection = new RTCPeerConnection(configuration);
 
    peerConnection.addEventListener('icecandidate', handleConnection);
    peerConnection.addEventListener('track', handleTrack);
 
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
 
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
 
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
 
    const message = {
      type: 'answer',
      data: answer,
    };
 
    ws.send(JSON.stringify(message));
  } catch (error) {
    console.error('Error handling offer:', error);
  }
}
 
function handleAnswerMessage(answer) {
  console.log('Received answer:', answer);
 
  const remoteDescription = new RTCSessionDescription(answer);
 
  peerConnection.setRemoteDescription(remoteDescription).then(function() {
    console.log('Remote description set successfully');
  });
}
 
function handleIceCandidate(event) {
  console.log('Received ICE candidate:', event);
 
  const message = {
    type: 'icecandidate',
    payload: event.candidate,
  };
 
  console.log('Sending ICE candidate:', message);
 
  socket.send(JSON.stringify(message));
}
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';

let scene, camera, renderer, audioContext, analyser, dataArray;
const shapes = [];

// Define instruments and their corresponding sounds
const instruments = {
    trumpet: 'sounds/trumpet.mp3',
    guitar: 'sounds/guitar.mp3',
    piano: 'sounds/piano.mp3', 
    flute: 'sounds/flute.mp3',
    drum: 'sounds/drum.mp3'
};

let currentSound = null; // Track the current sound for repetitive playback
let isSoundPlaying = false; // Track if sound is currently playing

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Check for WebXR support
    if (navigator.xr) {
        document.body.appendChild(VRButton.createButton(renderer));
        renderer.xr.enabled = true;

        // Hand tracking setup
        const handModelFactory = new XRHandModelFactory();
        const hand1 = renderer.xr.getHand(0);
        hand1.add(handModelFactory.createHandModel(hand1));
        scene.add(hand1);

        hand1.addEventListener('selectstart', onHandGestureStart);
        hand1.addEventListener('squeezestart', onHandGestureStart);
        hand1.addEventListener('selectend', onHandGestureEnd);
        hand1.addEventListener('squeezeend', onHandGestureEnd);
        hand1.addEventListener('handtracking', onHandMove);

        // Button for voice initiation
        const voiceButton = document.createElement('button');
        voiceButton.textContent = 'Start Voice Command';
        voiceButton.style.position = 'absolute';
        voiceButton.style.top = '20px';
        voiceButton.style.left = '20px';
        voiceButton.addEventListener('click', handleVoiceButtonClick); // Call handleVoiceButtonClick on button click
        document.body.appendChild(voiceButton);

        // Initialize voice recognition
        initVoiceRecognition();
    } else {
        document.getElementById('message').innerText = 'WebXR not supported. Running in non-VR mode.';
        console.log('WebXR not supported. Running in non-VR mode.');
    }

    camera.position.set(0, 1.6, 3);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    setupAudioProcessing();

    animate();
}

function setupAudioProcessing() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256; // Set the FFT size (frequency bin count)
  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength); // Initialize dataArray for frequency data

  navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
      })
      .catch(err => {
          console.error('Error accessing microphone:', err);
      });
}

function getAudioData() {
  if (!analyser) {
      console.error('Analyser not initialized.');
      return [];
  }

  analyser.getByteFrequencyData(dataArray);

  return Array.from(dataArray);
}

let recognition; // Declare recognition globally

function startVoiceRecognition() {
    if (!recognition) {
        console.error('Recognition object is not initialized.');
        return;
    }
    recognition.start();
}


function initVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.error('Web Speech API is not supported in this browser.');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = function(event) {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript.trim().toLowerCase();

        console.log('Voice command received:', command);

        if (command === 'yes') {
            createVisualsFromAudio('trumpet');
        } else if (command === 'yap' || command === 'yep') {
            createVisualsFromAudio('guitar');
        } else if (command === 'boom') {
            createVisualsFromAudio('drum');
        }else if (command === 'whoosh'){
          createVisualsFromAudio('flute');
        } else if (command === 'stop' || command === 'halt') {
          stopAllSounds();
      }
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
    };

    recognition.onend = function() {
        recognition.start(); // Restart recognition after it ends
    };

    // Note: Don't start recognition here initially
}


function stopAllSounds() {
  
  if (currentSound) {
      currentSound.stop(); // Stop the currently playing sound
      currentSound = null; // Reset the current sound variable
      isSoundPlaying = false; // Reset the sound playing state
  }
}

function handleVoiceButtonClick() {
    startVoiceRecognition(); // Call startVoiceRecognition function when voiceButton is clicked
}

function createVisualsFromAudio(instrument) {
  // Check if audio data is available
  const audioData = getAudioData();
  if (!audioData || audioData.length === 0) {
      console.warn('No audio data available.');
      return;
  }

  // Clear previous shapes
  shapes.forEach(shape => {
      scene.remove(shape);
  });
  shapes.length = 0;

  // Generate up to 5 shapes
  const numShapes = Math.min(audioData.length, 5); // Limit to 5 shapes

  for (let i = 0; i < numShapes; i++) {
      const averageFrequency = audioData[i] / 255 * 360;
      const color = new THREE.Color(`hsl(${averageFrequency}, 100%, 50%)`);
      const shape = new THREE.Mesh(
          new THREE.SphereGeometry(0.1),
          new THREE.MeshPhongMaterial({ color })
      );
      shape.position.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
      shape.userData = { color, size: 0.1, instrument };
      shapes.push(shape);
      scene.add(shape);
  }

  // Play sound based on the specified instrument
  playSound(instrument);
}

function playSound(instrument) {
  if (!audioContext) {
      console.error('AudioContext is not initialized.');
      return;
  }

  // Check if there's already a sound playing, and stop it
  if (currentSound) {
      currentSound.stop();
  }

  // Create a new buffer source node
  const source = audioContext.createBufferSource();

  // Load the audio file
  fetch(instruments[instrument])
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
          source.buffer = audioBuffer;
          source.loop = false; // Enable looping

          // Set playbackRate here
          source.playbackRate.value = 1.0; // Default playback rate

          source.connect(audioContext.destination);
          source.start(); // Start playing

          // Track the current sound for later control
          currentSound = source;
          isSoundPlaying = true;
      })
      .catch(err => {
          console.error('Error loading audio file:', err);
      });
}


let selectedShape = null;
let initialIntersectionPoint = new THREE.Vector3();
let initialShapeSize = 0;

function onHandGestureStart(event) {
    const hand = event.target;
    const intersections = getIntersections(hand);
    if (intersections.length > 0) {
        selectedShape = intersections[0].object;
        initialIntersectionPoint.copy(intersections[0].point);
        initialShapeSize = selectedShape.scale.x;
    }
}

function onHandGestureEnd(event) {
    selectedShape = null;
}

function onHandMove(event) {
    if (selectedShape) {
        const hand = event.target;
        const intersections = getIntersections(hand);
        if (intersections.length > 0) {
            const currentIntersectionPoint = intersections[0].point;
            const delta = currentIntersectionPoint.clone().sub(initialIntersectionPoint);
            const newSize = initialShapeSize + delta.length() * 2; // Adjust scale based on hand movement
            selectedShape.scale.set(newSize, newSize, newSize);
            selectedShape.userData.size = newSize;
            updateAudioProperties(selectedShape);
        }
    }
}

function getIntersections(hand) {
    const tempMatrix = new THREE.Matrix4().identity().extractRotation(hand.matrixWorld);
    const raycaster = new THREE.Raycaster();
    raycaster.ray.origin.setFromMatrixPosition(hand.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    return raycaster.intersectObjects(scene.children, true);
}

function updateAudioProperties(shape) {
    const { size, color, instrument } = shape.userData;

    if (!color) {
        console.error('Shape color is undefined in userData.');
        return;
    }

    const hsl = color.getHSL({}); // Get HSL values

    // Example: Adjust volume based on shape size
    const volume = size; // Adjust volume based on shape size

    // Example: Adjust pitch based on shape color
    const pitch = Math.max(0.5, Math.min(2.0, hsl.h)); // Adjust pitch within the range of 0.5 to 2.0


    // Example: Adjust audio playback based on instrument
    if (!isSoundPlaying) {
        playSound(instrument);
    } else {
        currentSound.volume = volume; // Adjust volume dynamically
        currentSound.playbackRate = pitch; // Adjust playback rate based on pitch
    }
}

function animate() {
    renderer.setAnimationLoop(() => {
        update();
        render();
    });
}


function update() {
  // Update your application logic here
  shapes.forEach(shape => {
      shape.rotation.y += 0.01; // Rotate shapes for example
  });

  // Ensure audio data availability before updating audio properties
  const audioData = getAudioData();
  if (!audioData || audioData.length === 0) {
      console.warn('No audio data available.');
      return;
  }

  // Update audio properties based on shape changes
  shapes.forEach(shape => {
      updateAudioProperties(shape);
  });
}

function render() {
    renderer.render(scene, camera);
}

init();

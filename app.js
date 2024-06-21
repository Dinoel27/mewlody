let scene, camera, renderer, analyser, dataArray;
const shapes = [];
let audioContext;
const activeInstruments = new Map();
let voiceWaveform;
const voiceWaveformData = [];
let isVoiceInput = false;

const toneMappings = {
    piano: {
        A: { color: 0xff0000, shape: THREE.SphereGeometry },
        B: { color: 0xffa500, shape: THREE.BoxGeometry },
        C: { color: 0xffff00, shape: THREE.ConeGeometry },
        D: { color: 0x008000, shape: THREE.CylinderGeometry },
        E: { color: 0x0000ff, shape: THREE.TorusGeometry },
        F: { color: 0x4b0082, shape: THREE.BoxGeometry },
        G: { color: 0xee82ee, shape: THREE.SphereGeometry }
    },
    guitar: {
        A: { color: 0xff5555, shape: THREE.SphereGeometry },
        B: { color: 0xffbb55, shape: THREE.BoxGeometry },
        C: { color: 0xffff77, shape: THREE.ConeGeometry },
        D: { color: 0x55aa55, shape: THREE.CylinderGeometry },
        E: { color: 0x5555ff, shape: THREE.TorusGeometry },
        F: { color: 0xaa55aa, shape: THREE.BoxGeometry },
        G: { color: 0xee55ee, shape: THREE.SphereGeometry }
    },
    drums: {
        A: { color: 0x8b0000, shape: THREE.SphereGeometry },
        B: { color: 0xff6347, shape: THREE.BoxGeometry },
        C: { color: 0xffd700, shape: THREE.ConeGeometry },
        D: { color: 0x32cd32, shape: THREE.CylinderGeometry },
        E: { color: 0x4169e1, shape: THREE.TorusGeometry },
        F: { color: 0x8a2be2, shape: THREE.BoxGeometry },
        G: { color: 0xda70d6, shape: THREE.SphereGeometry }
    },
    flute: {
        A: { color: 0x8b008b, shape: THREE.SphereGeometry },
        B: { color: 0xff69b4, shape: THREE.BoxGeometry },
        C: { color: 0xffc0cb, shape: THREE.ConeGeometry },
        D: { color: 0x00ff00, shape: THREE.CylinderGeometry },
        E: { color: 0x00ced1, shape: THREE.TorusGeometry },
        F: { color: 0x800080, shape: THREE.BoxGeometry },
        G: { color: 0xffb6c1, shape: THREE.SphereGeometry }
    },
    bass: {
        A: { color: 0xff8c00, shape: THREE.SphereGeometry },
        B: { color: 0xff4500, shape: THREE.BoxGeometry },
        C: { color: 0xffffe0, shape: THREE.ConeGeometry },
        D: { color: 0x006400, shape: THREE.CylinderGeometry },
        E: { color: 0x00008b, shape: THREE.TorusGeometry },
        F: { color: 0x800000, shape: THREE.BoxGeometry },
        G: { color: 0x8b4513, shape: THREE.SphereGeometry }
    },
    violin: {
        A: { color: 0x7cfc00, shape: THREE.SphereGeometry },
        B: { color: 0x20b2aa, shape: THREE.BoxGeometry },
        C: { color: 0xffa07a, shape: THREE.ConeGeometry },
        D: { color: 0x5f9ea0, shape: THREE.CylinderGeometry },
        E: { color: 0x4682b4, shape: THREE.TorusGeometry },
        F: { color: 0xdc143c, shape: THREE.BoxGeometry },
        G: { color: 0xff00ff, shape: THREE.SphereGeometry }
    },
    saxophone: {
        A: { color: 0xffd700, shape: THREE.SphereGeometry },
        B: { color: 0xcd5c5c, shape: THREE.BoxGeometry },
        C: { color: 0xff4500, shape: THREE.ConeGeometry },
        D: { color: 0x6b8e23, shape: THREE.CylinderGeometry },
        E: { color: 0x4682b4, shape: THREE.TorusGeometry },
        F: { color: 0xdda0dd, shape: THREE.BoxGeometry },
        G: { color: 0xda70d6, shape: THREE.SphereGeometry }
    },
    trumpet: {
        A: { color: 0xff7f50, shape: THREE.SphereGeometry },
        B: { color: 0xf0e68c, shape: THREE.BoxGeometry },
        C: { color: 0xff6347, shape: THREE.ConeGeometry },
        D: { color: 0x9acd32, shape: THREE.CylinderGeometry },
        E: { color: 0x4682b4, shape: THREE.TorusGeometry },
        F: { color: 0x800080, shape: THREE.BoxGeometry },
        G: { color: 0xff69b4, shape: THREE.SphereGeometry }
    },
    clarinet: {
        A: { color: 0xdda0dd, shape: THREE.SphereGeometry },
        B: { color: 0xb0e0e6, shape: THREE.BoxGeometry },
        C: { color: 0xdda0dd, shape: THREE.ConeGeometry },
        D: { color: 0x90ee90, shape: THREE.CylinderGeometry },
        E: { color: 0x4682b4, shape: THREE.TorusGeometry },
        F: { color: 0xd2691e, shape: THREE.BoxGeometry },
        G: { color: 0xc71585, shape: THREE.SphereGeometry }
    },
    cello: {
        A: { color: 0xcd853f, shape: THREE.SphereGeometry },
        B: { color: 0xffb6c1, shape: THREE.BoxGeometry },
        C: { color: 0xffdab9, shape: THREE.ConeGeometry },
        D: { color: 0xe9967a, shape: THREE.CylinderGeometry },
        E: { color: 0x4682b4, shape: THREE.TorusGeometry },
        F: { color: 0xa52a2a, shape: THREE.BoxGeometry },
        G: { color: 0xdc143c, shape: THREE.SphereGeometry }
    },
    harp: {
        A: { color: 0xe6e6fa, shape: THREE.SphereGeometry },
        B: { color: 0xffe4e1, shape: THREE.BoxGeometry },
        C: { color: 0xffd700, shape: THREE.ConeGeometry },
        D: { color: 0xadff2f, shape: THREE.CylinderGeometry },
                E: { color: 0x1e90ff, shape: THREE.TorusGeometry },
        F: { color: 0xee82ee, shape: THREE.BoxGeometry },
        G: { color: 0xff69b4, shape: THREE.SphereGeometry }
    }
};

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Initialize WebXR if available
    if (navigator.xr) {
        document.body.appendChild(VRButton.createButton(renderer));
        renderer.xr.enabled = true;

        const handModelFactory = new XRHandModelFactory();
        const hand1 = renderer.xr.getHand(0);
        hand1.add(handModelFactory.createHandModel(hand1));
        scene.add(hand1);

        hand1.addEventListener('selectstart', onHandGestureStart);
        hand1.addEventListener('squeezestart', onHandGestureStart);
        hand1.addEventListener('selectend', onHandGestureEnd);
        hand1.addEventListener('squeezeend', onHandGestureEnd);
        hand1.addEventListener('handtracking', onHandMove);

        const voiceButton = document.createElement('button');
        voiceButton.textContent = 'Start Voice Command';
        voiceButton.style.position = 'absolute';
        voiceButton.style.top = '20px';
        voiceButton.style.left = '20px';
        voiceButton.addEventListener('click', handleVoiceButtonClick);
        document.body.appendChild(voiceButton);

        initVoiceRecognition();
    } else {
        const messageElement = document.createElement('div');
        messageElement.id = 'message';
        messageElement.innerText = 'WebXR not supported. Running in non-VR mode.';
        document.body.appendChild(messageElement);
        console.log('WebXR not supported. Running in non-VR mode.');
    }

    camera.position.set(0, 1.6, 3);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    // Setup audio processing and pitch detection
    setupAudioProcessing();

    // Create voice waveform line
    createVoiceWaveform();

    // Start the animation loop
    animate();
}

function setupAudioProcessing() {
    window.addEventListener('mousedown', initAudioContext, { once: true });

    function initAudioContext() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        const bufferLength = analyser.fftSize;
        dataArray = new Uint8Array(bufferLength);

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);
                detectPitch();
            })
            .catch(err => {
                console.error('Error accessing microphone:', err);
            });
    }
}

function detectPitch() {
    const bufferLength = analyser.fftSize;
    const pitchBuffer = new Float32Array(bufferLength);

    function updatePitch() {
        analyser.getFloatTimeDomainData(pitchBuffer);
        const ac = autoCorrelate(pitchBuffer, audioContext.sampleRate);
        if (ac !== -1) {
            const pitch = ac;
            handlePitchDetected(pitch);
        }
        if (isVoiceInput) {
            updateVoiceWaveform(pitchBuffer);
        }
        requestAnimationFrame(updatePitch);
    }

    updatePitch();
}

function autoCorrelate(buffer, sampleRate) {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let best_offset = -1;
    let best_correlation = 0;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
        const val = buffer[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    if (rms < 0.01) {
        return -1;
    }

    let lastCorrelation = 1;
    for (let offset = 0; offset < MAX_SAMPLES; offset++) {
        let correlation = 0;

        for (let i = 0; i < MAX_SAMPLES; i++) {
            correlation += Math.abs((buffer[i]) - (buffer[i + offset]));
        }
        correlation = 1 - (correlation / MAX_SAMPLES);

        if (correlation > 0.9 && correlation > lastCorrelation) {
            best_correlation = correlation;
            best_offset = offset;
        }

        lastCorrelation = correlation;
    }

    if (best_correlation > 0.01) {
        const shift = (best_correlation - lastCorrelation) / 2;
        return sampleRate / (best_offset + shift);
    }

    return -1;
}

function handlePitchDetected(pitch) {
    const note = noteFromPitch(pitch);
    const noteName = noteStrings[note % 12];
    const instrument = detectInstrument();

    if (!toneMappings[instrument] || !toneMappings[instrument][noteName]) {
        console.log('Detected Note: Unidentified or invalid instrument/note');
        document.getElementById('noteDisplay').innerText = `Detected Note: Unidentified`;
        return;
    }

    console.log(`Detected Note: ${noteName} (Instrument: ${instrument})`);
    activeInstruments.set(instrument, noteName);
    updateInstrumentList();
    document.getElementById('noteDisplay').innerText = `Detected Note: ${noteName} (Instruments: ${Array.from(activeInstruments.keys()).join(', ')})`;
    const { color, shape } = toneMappings[instrument][noteName];
    const amplitude = calculateAmplitude(dataArray);
    addShape(color, shape, amplitude);
}

function detectInstrument() {
    const averageFrequency = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const maxFrequency = Math.max(...dataArray);

    if (maxFrequency > 8000) {
        return 'flute';
    } else if (maxFrequency > 6000) {
        return 'trumpet';
    } else if (maxFrequency > 4000) {
        return 'violin';
    } else if (maxFrequency > 2000) {
        return 'saxophone';
    } else if (averageFrequency > 180) {
        return 'guitar';
    } else if (averageFrequency > 140) {
        return 'drums';
    } else if (averageFrequency > 100) {
        return 'bass';
    } else if (averageFrequency > 60) {
        return 'cello';
    } else {
        return 'piano';
    }
}

function calculateAmplitude(dataArray) {
    return dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
}

function addShape(color, GeometryType, amplitude) {
    const material = new THREE.MeshStandardMaterial({ color });
    const size = 0.1 + amplitude * 0.5;
    let geometry;

    if (GeometryType === THREE.TorusGeometry) {
        geometry = new GeometryType(size, size / 4, 16, 100);
    } else if (GeometryType === THREE.ConeGeometry) {
        geometry = new GeometryType(size, size * 2, 32);
    } else if (GeometryType === THREE.SphereGeometry) {
        geometry = new GeometryType(size, 16, 16);
    } else if (GeometryType === THREE.CylinderGeometry) {
        geometry = new GeometryType(size, size, size * 2, 32);
    } else if (GeometryType === THREE.BoxGeometry) {
        geometry = new GeometryType(size, size, size);
    } else {
        console.error("Invalid Geometry Type");
        return;
    }

    if (geometry) {
        const shape = new THREE.Mesh(geometry, material);
        shape.position.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
        shapes.push(shape);
        scene.add(shape);

        // Remove shape after 5 seconds
        setTimeout(() => {
            scene.remove(shape);
            const index = shapes.indexOf(shape);
            if (index > -1) {
                shapes.splice(index, 1);
            }
        }, 5000);
    }
}

function createVoiceWaveform() {
    const voiceWaveformGeometry = new THREE.BufferGeometry();
    const voiceWaveformMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const positions = new Float32Array(360 * 3);
    voiceWaveformGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    voiceWaveform = new THREE.Line(voiceWaveformGeometry, voiceWaveformMaterial);
    scene.add(voiceWaveform);
}

function updateVoiceWaveform(pitchBuffer) {
    const positions = voiceWaveform.geometry.attributes.position.array;
    const radius = 1.5;
    const angleStep = (Math.PI * 2) / 360;

    for (let i = 0; i < 360; i++) {
        const angle = i * angleStep;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        const y = pitchBuffer[i] * 2; // Scale the waveform height

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
    }

    voiceWaveform.geometry.attributes.position.needsUpdate = true;
}

function updateInstrumentList() {
    const instrumentList = document.getElementById('instrumentList');
    instrumentList.innerHTML = 'Instruments:<br>';
    activeInstruments.forEach((note, instrument) => {
        instrumentList.innerHTML += `${instrument}: ${note}<br>`;
    });
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    renderer.render(scene, camera);
}

// Helper functions for pitch detection
const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteFromPitch(frequency) {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    return Math.round(noteNum) + 69;
}

// Example functions for XR hand gestures
function onHandGestureStart(event) {
    console.log('Hand gesture started:', event);
}

function onHandGestureEnd(event) {
    console.log('Hand gesture ended:', event);
}

function onHandMove(event) {
    console.log('Hand moved:', event);
}

function handleVoiceButtonClick(event) {
    console.log('Voice Button Clicked', event);
    isVoiceInput = true;
}

function initVoiceRecognition() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.start();
        recognition.onresult = function(event) {
            const result = event.results[0][0].transcript;
            console.log('Speech Recognition Result:', result);
        };
    } else {
        console.log('Speech recognition not supported in this browser.');
    }
}

init();

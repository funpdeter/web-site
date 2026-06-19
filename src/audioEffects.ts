let keyboardClickAudioContext: AudioContext | undefined;

const getKeyboardClickAudioContext = () => {
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    return undefined;
  }

  if (!keyboardClickAudioContext) {
    keyboardClickAudioContext = new AudioContextClass();
  }

  return keyboardClickAudioContext;
};

export const unlockKeyboardClickAudio = () => {
  const audioContext = getKeyboardClickAudioContext();

  if (audioContext?.state === 'suspended') {
    audioContext.resume().catch(() => undefined);
  }
};

export const playSpacebarClick = () => {
  const audioContext = getKeyboardClickAudioContext();

  if (!audioContext) {
    return;
  }

  const playClick = () => {
  const startTime = audioContext.currentTime;
  const bodyOscillator = audioContext.createOscillator();
  const bodyGain = audioContext.createGain();
  const tapOscillator = audioContext.createOscillator();
  const tapGain = audioContext.createGain();

  bodyOscillator.type = 'triangle';
  bodyOscillator.frequency.setValueAtTime(150, startTime);
  bodyOscillator.frequency.exponentialRampToValueAtTime(75, startTime + 0.06);

  bodyGain.gain.setValueAtTime(0.0001, startTime);
  bodyGain.gain.exponentialRampToValueAtTime(0.42, startTime + 0.004);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.075);

  tapOscillator.type = 'square';
  tapOscillator.frequency.setValueAtTime(620, startTime);
  tapOscillator.frequency.exponentialRampToValueAtTime(260, startTime + 0.018);

  tapGain.gain.setValueAtTime(0.0001, startTime);
  tapGain.gain.exponentialRampToValueAtTime(0.14, startTime + 0.002);
  tapGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.025);

  bodyOscillator.connect(bodyGain);
  tapOscillator.connect(tapGain);
  bodyGain.connect(audioContext.destination);
  tapGain.connect(audioContext.destination);

  bodyOscillator.start(startTime);
  tapOscillator.start(startTime);
  bodyOscillator.stop(startTime + 0.08);
  tapOscillator.stop(startTime + 0.03);
  };

  if (audioContext.state === 'suspended') {
    audioContext
      .resume()
      .then(() => {
        if (audioContext.state !== 'suspended') {
          playClick();
        }
      })
      .catch(() => undefined);
    return;
  }

  playClick();
};

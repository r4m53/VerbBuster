let awardAudioContext;

export async function playAwardFanfare(tier = 'bronze') {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return false;
  awardAudioContext ||= new AudioContextClass();
  const context = awardAudioContext;
  if (context.state === 'suspended') await context.resume();

  const start = context.currentTime + 0.03;
  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();
  master.gain.setValueAtTime(0.0001, start);
  master.gain.exponentialRampToValueAtTime(0.62, start + 0.04);
  master.gain.setValueAtTime(0.62, start + 3.05);
  master.gain.exponentialRampToValueAtTime(0.0001, start + 3.5);
  compressor.threshold.value = -18;
  compressor.knee.value = 12;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.22;
  master.connect(compressor); compressor.connect(context.destination);

  const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'ruby', 'emerald', 'diamond'];
  const level = Math.max(0, tierOrder.indexOf(String(tier).toLowerCase()));
  const melody = [
    [261.63, 0, 0.34], [329.63, 0.28, 0.34], [392, 0.56, 0.5],
    [523.25, 1.02, 0.42], [659.25, 1.38, 0.42], [783.99, 1.74, 0.85]
  ];
  if (level >= 1) melody.push([1046.5, 2.18, 0.75]);
  if (level >= 2) melody.push([1318.51, 2.48, 0.8]);
  for (const [frequency, offset, duration] of melody) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = offset < 1 ? 'triangle' : 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start + offset);
    gain.gain.exponentialRampToValueAtTime(0.72, start + offset + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + duration);
    oscillator.connect(gain); gain.connect(master);
    oscillator.start(start + offset);
    oscillator.stop(start + offset + duration + 0.05);
  }
  const supportingNotes = [];
  if (level >= 1) supportingNotes.push([130.81, 0, 1], [196, 1.02, 1.15]);
  if (level >= 3) supportingNotes.push([261.63, 1.74, 1.25], [392, 2.18, 1.15]);
  if (level >= 4) supportingNotes.push([523.25, 2.48, 0.85]);
  if (level >= 5) supportingNotes.push([659.25, 2.72, 0.7]);
  if (level >= 6) supportingNotes.push([783.99, 2.88, 0.62], [1046.5, 3.02, 0.5]);
  for (const [frequency, offset, duration] of supportingNotes) {
    const oscillator = context.createOscillator(); const gain = context.createGain();
    oscillator.type = level >= 5 ? 'sawtooth' : 'triangle'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start + offset); gain.gain.exponentialRampToValueAtTime(0.24, start + offset + 0.04); gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + duration);
    oscillator.connect(gain); gain.connect(master); oscillator.start(start + offset); oscillator.stop(start + offset + duration + 0.05);
  }
  return true;
}

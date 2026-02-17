// Timer Web Worker
// Runs a setInterval in a separate thread so browser tab throttling
// cannot freeze the tick cadence.

let intervalId = null;

self.onmessage = function (e) {
  const { type } = e.data;

  if (type === 'start') {
    // Clear any existing interval first
    if (intervalId !== null) {
      clearInterval(intervalId);
    }

    // Post an immediate tick, then every second
    self.postMessage({ type: 'tick' });
    intervalId = setInterval(() => {
      self.postMessage({ type: 'tick' });
    }, 1000);
  }

  if (type === 'stop') {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
};

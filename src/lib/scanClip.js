/** Short camera recording during object scan for immersive mode (same view as the still). */

export function pickRecorderMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  for (const t of types) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t;
    } catch {
      /* ignore */
    }
  }
  return '';
}

/**
 * Records `durationMs` from a live camera stream (parallel to still capture + AI).
 * @returns {Promise<string>} object URL for a short muted clip, or '' if unsupported / failed
 */
export function recordClipFromStream(stream, durationMs = 3400) {
  return new Promise((resolve) => {
    if (!stream || typeof MediaRecorder === 'undefined') {
      resolve('');
      return;
    }
    let settled = false;
    let watchdog;
    const finish = (url) => {
      if (settled) return;
      settled = true;
      if (watchdog) clearTimeout(watchdog);
      resolve(url || '');
    };

    const mime = pickRecorderMimeType();
    let mr;
    try {
      mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch {
      finish('');
      return;
    }
    const chunks = [];
    mr.ondataavailable = (e) => {
      if (e.data?.size > 0) chunks.push(e.data);
    };
    mr.onstop = () => {
      try {
        const blob = new Blob(chunks, { type: mr.mimeType || 'video/webm' });
        if (blob.size < 300) {
          finish('');
          return;
        }
        finish(URL.createObjectURL(blob));
      } catch {
        finish('');
      }
    };
    mr.onerror = () => finish('');
    watchdog = setTimeout(() => finish(''), durationMs + 2500);
    try {
      mr.start(200);
      setTimeout(() => {
        try {
          if (mr.state !== 'inactive') mr.stop();
        } catch {
          finish('');
        }
      }, durationMs);
    } catch {
      finish('');
      return;
    }
  });
}

/**
 * Fal.ai API Service
 * Handles TTS (ElevenLabs), FFmpeg merge, and auto-subtitle.
 * Ported from n8n "Create Voice", "Merge", "Add Subs" nodes.
 */

const FAL_QUEUE = 'https://queue.fal.run';

async function submitFalJob(endpoint, payload, apiKey) {
  const res = await fetch(`${FAL_QUEUE}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Fal.ai submit error (${endpoint}): ${res.status} — ${err}`);
  }

  return res.json();
}

async function getFalResult(endpoint, requestId, apiKey) {
  const res = await fetch(`${FAL_QUEUE}/${endpoint}/requests/${requestId}`, {
    headers: {
      'Authorization': `Key ${apiKey}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Fal.ai result error: ${res.status} — ${err}`);
  }

  return res.json();
}

/**
 * Poll a Fal.ai job until completion
 */
async function pollFalJob(endpoint, requestId, apiKey, maxAttempts = 60, intervalMs = 10000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = await getFalResult(endpoint, requestId, apiKey);

      // Fal jobs return data directly when complete
      if (result && !result.status) {
        return result;
      }

      if (result.status === 'COMPLETED') {
        return result;
      }

      if (result.status === 'FAILED') {
        throw new Error(`Fal.ai job failed: ${JSON.stringify(result)}`);
      }
    } catch (err) {
      // 422 means still processing
      if (!err.message.includes('422') && !err.message.includes('in_queue') && !err.message.includes('in_progress')) {
        throw err;
      }
    }

    await new Promise(r => setTimeout(r, intervalMs));
  }

  throw new Error(`Fal.ai job timed out for ${endpoint}/${requestId}`);
}

/**
 * Generate speech from text using ElevenLabs via Fal.ai
 */
export async function textToSpeech(text, apiKey, voice = 'Rachel') {
  const endpoint = 'fal-ai/elevenlabs/tts/turbo-v2.5';

  const job = await submitFalJob(endpoint, {
    text,
    voice,
    stability: 0.5,
    similarity_boost: 0.75,
  }, apiKey);

  const requestId = job.request_id;
  if (!requestId) throw new Error('No request_id for TTS job');

  await new Promise(r => setTimeout(r, 15000));

  const result = await pollFalJob('fal-ai/elevenlabs', requestId, apiKey);
  return result?.audio?.url || null;
}

/**
 * Merge video clips + audio tracks using FFmpeg via Fal.ai
 */
export async function mergeVideos(videoUrls, voiceUrls, musicUrl, apiKey) {
  const duration = 5000; // 5s per clip

  // Build video track
  const videoKeyframes = videoUrls.map((url, index) => ({
    url,
    timestamp: index * duration,
    duration,
  }));

  const videoTrack = {
    id: '1',
    type: 'video',
    keyframes: videoKeyframes,
  };

  // Build voice audio tracks
  const audioTracks = voiceUrls.map((url, index) => ({
    id: String(index + 2),
    type: 'audio',
    keyframes: [{
      url,
      timestamp: index * duration,
      duration,
    }],
  }));

  // Build tracks array
  const tracks = [videoTrack, ...audioTracks];

  // Add music track if available
  if (musicUrl) {
    tracks.push({
      id: '100',
      type: 'audio',
      keyframes: [{
        timestamp: 0,
        duration: videoUrls.length * duration,
        url: musicUrl,
      }],
    });
  }

  const endpoint = 'fal-ai/ffmpeg-api/compose';

  const job = await submitFalJob(endpoint, { tracks }, apiKey);
  const requestId = job.request_id;
  if (!requestId) throw new Error('No request_id for merge job');

  await new Promise(r => setTimeout(r, 30000));

  const result = await pollFalJob('fal-ai/ffmpeg-api', requestId, apiKey, 60, 15000);
  return result?.video_url || result?.url || null;
}

/**
 * Add animated subtitles to a video using Fal.ai
 */
export async function addSubtitles(videoUrl, apiKey) {
  const endpoint = 'fal-ai/workflow-utilities/auto-subtitle';

  const job = await submitFalJob(endpoint, {
    video_url: videoUrl,
    language: 'en',
    font_name: 'Montserrat',
    font_size: 100,
    font_weight: 'bold',
    font_color: 'white',
    highlight_color: 'purple',
    stroke_width: 3,
    stroke_color: 'black',
    background_color: 'none',
    position: 'bottom',
    y_offset: 75,
    words_per_subtitle: 1,
    enable_animation: true,
  }, apiKey);

  const requestId = job.request_id;
  if (!requestId) throw new Error('No request_id for subtitle job');

  await new Promise(r => setTimeout(r, 60000));

  const result = await pollFalJob('fal-ai/workflow-utilities', requestId, apiKey, 60, 20000);
  return result?.video?.url || result?.video_url || null;
}

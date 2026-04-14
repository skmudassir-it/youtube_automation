/**
 * Kie.ai API Service
 * Handles image generation (NanoBanana) and video generation (Seedance).
 * Ported from n8n "Generate Image" and "Generate Video" nodes.
 */

const KIE_BASE = 'https://api.kie.ai/api/v1/jobs';

async function createTask(payload, apiKey) {
  const res = await fetch(`${KIE_BASE}/createTask`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Kie.ai createTask error: ${res.status} — ${err}`);
  }

  return res.json();
}

async function getTaskResult(taskId, apiKey) {
  const res = await fetch(`${KIE_BASE}/recordInfo?taskId=${taskId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Kie.ai recordInfo error: ${res.status} — ${err}`);
  }

  return res.json();
}

/**
 * Poll a Kie.ai task until completion
 */
async function pollTask(taskId, apiKey, maxAttempts = 60, intervalMs = 10000) {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getTaskResult(taskId, apiKey);

    if (result.data?.status === 'completed' || result.data?.status === 'succeed') {
      return result;
    }

    if (result.data?.status === 'failed') {
      throw new Error(`Kie.ai task ${taskId} failed: ${JSON.stringify(result.data)}`);
    }

    await new Promise(r => setTimeout(r, intervalMs));
  }

  throw new Error(`Kie.ai task ${taskId} timed out after ${maxAttempts} attempts`);
}

/**
 * Extract URL from Kie.ai result
 */
function extractUrl(result) {
  if (result?.data?.resultJson) {
    const parsed = typeof result.data.resultJson === 'string'
      ? JSON.parse(result.data.resultJson)
      : result.data.resultJson;

    if (parsed.resultUrls?.length > 0) {
      return parsed.resultUrls[0];
    }
  }
  return null;
}

/**
 * Generate an image using NanoBanana via Kie.ai
 */
export async function generateImage(prompt, referenceImageUrls, aspectRatio, apiKey) {
  const payload = {
    model: 'google/nano-banana-edit',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      prompt,
      image_urls: referenceImageUrls || [],
      output_format: 'png',
      image_size: aspectRatio || '16:9',
    },
  };

  const task = await createTask(payload, apiKey);
  const taskId = task.data?.taskId;
  if (!taskId) throw new Error('No taskId returned from image generation');

  // Wait before polling
  await new Promise(r => setTimeout(r, 10000));

  const result = await pollTask(taskId, apiKey);
  const url = extractUrl(result);

  if (!url) throw new Error('No image URL in result');
  return url;
}

/**
 * Generate a video clip from an image using Seedance via Kie.ai
 */
export async function generateVideo(prompt, imageUrl, aspectRatio, apiKey) {
  const payload = {
    model: 'bytedance/v1-lite-image-to-video',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      prompt,
      image_url: imageUrl,
      resolution: '1080p',
      duration: '5',
      camera_fixed: false,
      seed: -1,
      enable_safety_checker: true,
    },
  };

  const task = await createTask(payload, apiKey);
  const taskId = task.data?.taskId;
  if (!taskId) throw new Error('No taskId returned from video generation');

  // Video generation takes longer
  await new Promise(r => setTimeout(r, 30000));

  const result = await pollTask(taskId, apiKey, 120, 15000);
  const url = extractUrl(result);

  if (!url) throw new Error('No video URL in result');
  return url;
}

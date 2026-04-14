/**
 * Blotato API Service
 * Handles media upload and post scheduling to social media platforms.
 * Ported from n8n "Upload to Blotato" and "Sched on YouTube" nodes.
 */

const BLOTATO_BASE = 'https://backend.blotato.com/v2';

/**
 * Upload a media file (video URL) to Blotato
 */
export async function uploadMedia(videoUrl, apiKey) {
  const res = await fetch(`${BLOTATO_BASE}/media`, {
    method: 'POST',
    headers: {
      'blotato-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: videoUrl }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Blotato upload error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return data?.url || data?.mediaUrl || videoUrl;
}

/**
 * Schedule a post on a social media platform via Blotato
 */
export async function schedulePost({ accountId, platform, title, description, mediaUrl, scheduledTime, apiKey }) {
  const postPayload = {
    post: {
      accountId: String(accountId),
      content: {
        text: description,
        mediaUrls: [mediaUrl],
        platform,
      },
      target: buildTarget(platform, title),
    },
  };

  if (scheduledTime) {
    postPayload.scheduledTime = scheduledTime;
  }

  const res = await fetch(`${BLOTATO_BASE}/posts`, {
    method: 'POST',
    headers: {
      'blotato-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postPayload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Blotato schedule error (${platform}): ${res.status} — ${err}`);
  }

  return res.json();
}

/**
 * Build platform-specific target object
 */
function buildTarget(platform, title) {
  const base = { targetType: platform };

  switch (platform) {
    case 'youtube':
      return {
        ...base,
        title,
        privacyStatus: 'public',
        shouldNotifySubscribers: true,
        isMadeForKids: false,
      };
    case 'tiktok':
      return { ...base, title };
    case 'instagram':
      return { ...base, title };
    case 'x':
      return { ...base };
    case 'facebook':
      return { ...base, title };
    case 'linkedin':
      return { ...base, title };
    case 'pinterest':
      return { ...base, title };
    case 'threads':
      return { ...base };
    default:
      return base;
  }
}

/**
 * Get platform account ID mapping from environment
 */
export function getAccountId(platform) {
  const map = {
    youtube: process.env.BLOTATO_YOUTUBE_ACCOUNT_ID,
    tiktok: process.env.BLOTATO_TIKTOK_ACCOUNT_ID,
    instagram: process.env.BLOTATO_INSTAGRAM_ACCOUNT_ID,
    x: process.env.BLOTATO_X_ACCOUNT_ID,
    facebook: process.env.BLOTATO_FACEBOOK_ACCOUNT_ID,
    linkedin: process.env.BLOTATO_LINKEDIN_ACCOUNT_ID,
    pinterest: process.env.BLOTATO_PINTEREST_ACCOUNT_ID,
    threads: process.env.BLOTATO_THREADS_ACCOUNT_ID,
  };

  return map[platform] || null;
}

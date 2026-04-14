/**
 * Pipeline Orchestrator
 * Orchestrates the complete AI content generation pipeline.
 * Replicates the n8n workflow: Scenes → Images → Videos → Voice → Merge → Subs → Publish
 */

import { generateScenes, generateNarration, generateMetadata } from './services/openrouter.js';
import { generateImage, generateVideo } from './services/kieai.js';
import { textToSpeech, mergeVideos, addSubtitles } from './services/falai.js';
import { uploadMedia, schedulePost, getAccountId } from './services/blotato.js';

/**
 * Aspect ratio mapping per platform
 */
const PLATFORM_ASPECT_RATIOS = {
  youtube: '16:9',
  tiktok: '9:16',
  instagram: '9:16',
  x: '1:1',
  facebook: '16:9',
  linkedin: '1:1',
  pinterest: '2:3',
  threads: '4:5',
};

/**
 * Run the full pipeline for a job
 */
export async function runPipeline(job, updateStatus) {
  const { storyPrompt, visualStyle, platforms, referenceImageUrls, musicUrl } = job;

  const apiKeys = {
    openrouter: process.env.OPENROUTER_API_KEY,
    fal: process.env.FAL_API_KEY,
    kie: process.env.KIE_API_KEY,
    blotato: process.env.BLOTATO_API_KEY,
  };

  // Determine primary aspect ratio (use the first platform's AR)
  const primaryPlatform = platforms[0] || 'youtube';
  const aspectRatio = PLATFORM_ASPECT_RATIOS[primaryPlatform] || '16:9';
  const numScenes = 3;

  try {
    // ═══════════════════════════════════════════
    // STEP 1: Generate Scenes via OpenRouter
    // ═══════════════════════════════════════════
    updateStatus('generating_scenes', 'Generating story scenes with AI...', 15);

    const scenes = await generateScenes(storyPrompt, visualStyle, aspectRatio, numScenes, apiKeys.openrouter);
    job.scenes = scenes;

    // ═══════════════════════════════════════════
    // STEP 2: Generate Images via Kie.ai
    // ═══════════════════════════════════════════
    updateStatus('generating_images', 'Creating images for each scene...', 30);

    const imageUrls = [];
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      updateStatus('generating_images', `Creating image ${i + 1} of ${scenes.length}...`, 30 + (i / scenes.length) * 15);

      const imageUrl = await generateImage(
        scene.image_prompt,
        referenceImageUrls || [],
        aspectRatio,
        apiKeys.kie
      );
      imageUrls.push(imageUrl);
    }

    job.imageUrls = imageUrls;

    // ═══════════════════════════════════════════
    // STEP 3: Generate Videos via Kie.ai
    // ═══════════════════════════════════════════
    updateStatus('generating_videos', 'Converting images to video clips...', 45);

    const videoUrls = [];
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      updateStatus('generating_videos', `Generating video clip ${i + 1} of ${scenes.length}...`, 45 + (i / scenes.length) * 10);

      const videoUrl = await generateVideo(
        scene.image_prompt,
        imageUrls[i],
        aspectRatio,
        apiKeys.kie
      );
      videoUrls.push(videoUrl);
    }

    job.videoUrls = videoUrls;

    // ═══════════════════════════════════════════
    // STEP 4: Generate Narration + Voice via OpenRouter + Fal.ai
    // ═══════════════════════════════════════════
    updateStatus('generating_audio', 'Creating voiceover narration...', 60);

    const voiceUrls = [];
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      updateStatus('generating_audio', `Narrating scene ${i + 1} of ${scenes.length}...`, 60 + (i / scenes.length) * 10);

      const narration = await generateNarration(scene.caption, apiKeys.openrouter);
      const voiceUrl = await textToSpeech(narration, apiKeys.fal);
      voiceUrls.push(voiceUrl);
    }

    job.voiceUrls = voiceUrls;

    // ═══════════════════════════════════════════
    // STEP 5: Merge Videos + Audio via Fal.ai FFmpeg
    // ═══════════════════════════════════════════
    updateStatus('merging', 'Merging video clips with audio...', 75);

    const mergedUrl = await mergeVideos(videoUrls, voiceUrls, musicUrl || null, apiKeys.fal);
    job.mergedVideoUrl = mergedUrl;

    // ═══════════════════════════════════════════
    // STEP 6: Add Subtitles via Fal.ai
    // ═══════════════════════════════════════════
    updateStatus('adding_subtitles', 'Adding animated subtitles...', 85);

    const subtitledUrl = await addSubtitles(mergedUrl, apiKeys.fal);
    job.finalVideoUrl = subtitledUrl || mergedUrl;

    // ═══════════════════════════════════════════
    // STEP 7: Generate Metadata for each platform
    // ═══════════════════════════════════════════
    updateStatus('generating_metadata', 'Generating titles, descriptions, and tags...', 90);

    const metadata = {};
    for (const platform of platforms) {
      const meta = await generateMetadata(storyPrompt, visualStyle, platform, apiKeys.openrouter);
      metadata[platform] = meta;
    }

    job.metadata = metadata;

    // ═══════════════════════════════════════════
    // STEP 8: Publish to selected platforms via Blotato
    // ═══════════════════════════════════════════
    updateStatus('publishing', 'Publishing to social media...', 95);

    // Upload media to Blotato
    const blotatoMediaUrl = await uploadMedia(job.finalVideoUrl, apiKeys.blotato);

    const publishResults = {};
    for (const platform of platforms) {
      const accountId = getAccountId(platform);
      if (!accountId) {
        publishResults[platform] = { status: 'skipped', reason: 'No account ID configured' };
        continue;
      }

      try {
        const postMeta = metadata[platform] || {};
        const scheduledTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

        const result = await schedulePost({
          accountId,
          platform,
          title: postMeta.title || 'Untitled',
          description: postMeta.description || '',
          mediaUrl: blotatoMediaUrl,
          scheduledTime,
          apiKey: apiKeys.blotato,
        });

        publishResults[platform] = { status: 'scheduled', result };
      } catch (err) {
        publishResults[platform] = { status: 'failed', error: err.message };
      }
    }

    job.publishResults = publishResults;

    // ═══════════════════════════════════════════
    // DONE
    // ═══════════════════════════════════════════
    updateStatus('completed', 'Content creation complete!', 100);

    return job;

  } catch (error) {
    updateStatus('failed', `Pipeline failed: ${error.message}`, 0);
    job.error = error.message;
    throw error;
  }
}

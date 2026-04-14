/**
 * OpenRouter API Service
 * Handles all LLM calls for scene generation, narration, and metadata.
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';

export async function chatCompletion(systemPrompt, userPrompt, apiKey) {
  const res = await fetch(OPENROUTER_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3001',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Generate scene descriptions from a story prompt + visual style
 */
export async function generateScenes(storyPrompt, visualStyle, aspectRatio, numScenes, apiKey) {
  const systemPrompt = `You are an expert prompt engineer for ${visualStyle} videos. Your task is to create sequential voiceover and image prompts for a video.

Generate a JSON object with a single root key "scenes" containing an array of ${numScenes} scene objects. Each scene must flow smoothly into the next as a cohesive story.

For each scene provide:
- "scene": Sequential number starting at 1
- "caption": One sentence, 7-12 words, spoken in under 5 seconds
- "image_prompt": One descriptive sentence combining character, setting, visual style, mood, and colors. Style: ${visualStyle}
- "aspect_ratio": "${aspectRatio}"

CRITICAL:
- All scenes must connect as one seamless video story
- Avoid repetition across captions and image prompts
- Avoid any sensitive content or violence
- DO NOT use ANY names of specific people (not even fictional ones like "Amaira"), copyrighted/trademarked terms, or real-world brands in the image_prompt (e.g., use "a little girl" instead of "Amaira", "plastic brick toy figures" instead of "Lego", and "yellow pill-shaped cartoon creature in overalls" instead of "Minion"). The image AI will strictly block the generation if it detects ANY names or trademarks.
- You must reply ONLY with a valid JSON object starting with { "scenes": [ ...`;

  const userPrompt = `Create ${numScenes} ${visualStyle} video scenes for this story:\n\n${storyPrompt}`;

  const raw = await chatCompletion(systemPrompt, userPrompt, apiKey);

  // Extract JSON from response
  try {
    const parsed = JSON.parse(raw);
    return parsed.scenes;
  } catch (err) {
    console.error(`\n=== FAILED LLM PARSE ===\nRAW RESPONSE:\n${raw}\n=========================\n`);
    throw new Error('LLM returned malformed JSON: ' + err.message);
  }
}

/**
 * Generate narration text for a scene
 */
export async function generateNarration(scenePrompt, apiKey) {
  const systemPrompt = `You are a short, concise commentary creator. Based on user input, create a one-sentence commentary for viewers. The sentence must be less than 15 words. Use everyday witty english. Output ONLY the sentence, nothing else.`;

  return chatCompletion(systemPrompt, `Create a one sentence commentary for: ${scenePrompt}`, apiKey);
}

/**
 * Generate title, description, and tags for a platform
 */
export async function generateMetadata(storyPrompt, visualStyle, platform, apiKey) {
  const systemPrompt = `You are a social media content strategist. Generate metadata for a ${platform} video post.

Output ONLY valid JSON with these fields:
- "title": Catchy, platform-appropriate title (max 100 chars)
- "description": Engaging description with relevant hashtags (max 500 chars for ${platform})
- "tags": Array of 10-15 relevant tags/keywords

Platform guidelines:
- YouTube: SEO-optimized title, detailed description
- TikTok: Trendy, short, hashtag-heavy
- Instagram: Visual-focused, emoji-rich
- X/Twitter: Concise, punchy
- Facebook: Community-engaging
- LinkedIn: Professional tone
- Pinterest: Descriptive, keyword-rich
- Threads: Conversational`;

  const userPrompt = `Story: ${storyPrompt}\nVisual Style: ${visualStyle}\nPlatform: ${platform}`;

  const raw = await chatCompletion(systemPrompt, userPrompt, apiKey);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse metadata JSON');

  return JSON.parse(jsonMatch[0]);
}

import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { joggAiAuth } from '../../..';
import { joggAiClient } from '../../common/client';
import { joggAiOutputSchemas } from '../../common/output-schemas';

export const aiCreateAvatarVideo = createAction({
  auth: joggAiAuth,
  name: 'ai_create_avatar_video',
  displayName: 'Create Avatar Video',
  description: 'Starts rendering a talking-avatar video from a script or an audio file.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: joggAiOutputSchemas.aiCreateVideo,
  aiMetadata: {
    description:
      'Starts rendering a talking-avatar video on JoggAI and returns its video_id. Give an avatar_id (from List Public Avatars with avatar type public, or List Custom Avatars with type custom), a voice_id from List Voices, and exactly one of script or audio_url. Rendering is async and spends credits: poll Get Avatar Video with the video_id or use the video triggers. Renders need video render credits on the JoggAI plan, and Get Remaining Quota may not reflect them, so code 18020 Insufficient credit can occur even when quota looks available. Not idempotent: every call queues and bills a new video.',
    idempotent: false,
  },
  props: {
    avatar_id: Property.ShortText({
      displayName: 'Avatar ID',
      description: 'Numeric avatar id from List Public Avatars or List Custom Avatars.',
      required: true,
    }),
    avatar_type: Property.StaticDropdown({
      displayName: 'Avatar Type',
      description: 'public for library avatars, custom for your own. Defaults to public.',
      required: false,
      options: {
        options: [
          { label: 'Public (JoggAI library)', value: 'public' },
          { label: 'Custom (your avatar)', value: 'custom' },
        ],
      },
    }),
    voice_id: Property.ShortText({
      displayName: 'Voice ID',
      description: 'voice_id from List Voices.',
      required: true,
    }),
    script: Property.LongText({
      displayName: 'Script',
      description: 'Text the avatar speaks. Leave empty when using Audio URL.',
      required: false,
    }),
    audio_url: Property.ShortText({
      displayName: 'Audio URL',
      description: 'Public URL of an audio file to lip-sync. Leave empty when using Script.',
      required: false,
    }),
    aspect_ratio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      description: 'Defaults to portrait.',
      required: false,
      options: {
        options: [
          { label: 'Portrait (9:16)', value: 'portrait' },
          { label: 'Landscape (16:9)', value: 'landscape' },
          { label: 'Square (1:1)', value: 'square' },
        ],
      },
    }),
    screen_style: Property.StaticDropdown({
      displayName: 'Screen Style',
      description: 'Defaults to full.',
      required: false,
      options: {
        options: [
          { label: 'Full', value: 'full' },
          { label: 'Split', value: 'split' },
          { label: 'Picture in picture', value: 'picture_in_picture' },
        ],
      },
    }),
    caption: Property.StaticDropdown({
      displayName: 'Captions',
      description: 'Burn subtitles into the video. Defaults to the JoggAI setting.',
      required: false,
      options: { options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
    }),
    video_name: Property.ShortText({
      displayName: 'Video Name',
      required: false,
    }),
  },
  async run(context) {
    const { avatar_id, avatar_type, voice_id, script, audio_url, aspect_ratio, screen_style, caption, video_name } =
      context.propsValue;
    const scriptText = script?.trim() ?? '';
    const audioUrl = audio_url?.trim() ?? '';
    if ((scriptText && audioUrl) || (!scriptText && !audioUrl)) {
      throw new Error('Provide exactly one of Script or Audio URL.');
    }
    if (!voice_id.trim()) {
      throw new Error('Voice ID is required.');
    }
    const data = await joggAiClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v2/create_video_from_avatar',
      op: 'create avatar video',
      body: {
        avatar: {
          avatar_type: avatar_type === 'custom' ? 1 : 0,
          avatar_id: joggAiClient.toIntegerId({ value: avatar_id, label: 'Avatar ID' }),
        },
        voice: scriptText
          ? { type: 'script', script: scriptText, voice_id: voice_id.trim() }
          : { type: 'audio', audio_url: audioUrl, voice_id: voice_id.trim() },
        aspect_ratio: aspect_ratio ?? 'portrait',
        screen_style: SCREEN_STYLES[screen_style ?? 'full'] ?? 1,
        ...(caption === 'yes' || caption === 'no' ? { caption: caption === 'yes' } : {}),
        ...(video_name?.trim() ? { video_name: video_name.trim() } : {}),
      },
    });
    return { video_id: data['video_id'] ?? null };
  },
});

const SCREEN_STYLES: Record<string, number> = {
  full: 1,
  split: 2,
  picture_in_picture: 3,
};

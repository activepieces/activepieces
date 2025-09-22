import { createAction, Property } from '@activepieces/pieces-framework';
import { vadooAiAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const generateVideo = createAction({
  auth: vadooAiAuth,
  name: 'generate_video',
  displayName: 'Generate Video',
  description: 'Create an AI-generated video from a topic or custom script.',
  props: {
    topic: Property.ShortText({
      displayName: 'Topic',
      description: 'The subject for the video content. Use "Custom" to provide your own script in the "Prompt" field.',
      required: false,
    }),
    prompt: Property.LongText({
        displayName: 'Custom Script (Prompt)',
        description: 'Your custom script. This is only used when the "Topic" is set to "Custom".',
        required: false,
    }),
    voice: Property.ShortText({
        displayName: 'Voice',
        description: 'The desired voice for the video\'s narration (e.g., "Charlie").',
        required: false,
    }),
    theme: Property.ShortText({
        displayName: 'Captions Theme',
        description: 'The style for the video\'s captions (e.g., "Hormozi_1").',
        required: false,
    }),
    style: Property.ShortText({
        displayName: 'AI Image Style',
        description: 'The style for the AI-generated images.',
        required: false,
    }),
    language: Property.ShortText({
        displayName: 'Language',
        description: 'The language for the video generation (e.g., "English").',
        required: false,
    }),
    duration: Property.StaticDropdown({
        displayName: 'Duration',
        description: 'The target length of the video.',
        required: false,
        options: {
            options: [
                { label: '30-60 seconds', value: '30-60' },
                { label: '60-90 seconds', value: '60-90' },
                { label: '90-120 seconds', value: '90-120' },
                { label: '120-180 seconds', value: '120-180' },
                { label: '5 minutes', value: '5 min' },
                { label: '10 minutes', value: '10 min' },
            ]
        }
    }),
    aspect_ratio: Property.StaticDropdown({
        displayName: 'Aspect Ratio',
        required: false,
        options: {
            options: [
                { label: 'Portrait (9:16)', value: '9:16' },
                { label: 'Square (1:1)', value: '1:1' },
                { label: 'Landscape (16:9)', value: '16:9' },
            ]
        }
    }),
    url: Property.ShortText({
        displayName: 'Source URL (Blog to Video)',
        description: 'Provide a URL to convert a blog post or article into a video.',
        required: false,
    }),
    custom_instruction: Property.LongText({
        displayName: 'Custom Instructions',
        description: 'Guide the AI with specific instructions for character descriptions, image visuals, background styles, etc.',
        required: false,
    }),
    include_voiceover: Property.StaticDropdown({
        displayName: 'Include AI Voiceover',
        required: false,
        options: {
            options: [
                { label: 'Yes', value: '1' },
                { label: 'No', value: '0' },
            ]
        }
    }),
    bg_music: Property.ShortText({
        displayName: 'Background Music',
        description: 'URL or name of the background music to use.',
        required: false,
    }),
    bg_music_volume: Property.Number({
        displayName: 'Background Music Volume',
        description: 'A value between 1 and 100.',
        required: false,
    }),
  },
  async run(context) {
    const { ...body } = context.propsValue;

    return await makeRequest<{ vid: number }>(
      context.auth,
      HttpMethod.POST,
      '/generate_video',
      body
    );
  },
});
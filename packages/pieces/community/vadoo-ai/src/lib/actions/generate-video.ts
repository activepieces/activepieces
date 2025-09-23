import { createAction, Property } from '@activepieces/pieces-framework';
import { vadooAiAuth } from '../../index';
import { httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { generateVideoSchema } from '../schemas';

export const generateVideo = createAction({
  auth: vadooAiAuth,
  name: 'generate_video',
  displayName: 'Generate Video',
  description: 'Create an AI-generated video from parameters',
  props: {
    topic: Property.StaticDropdown({
      displayName: 'Topic',
      description: 'To create content for AI Video',
      required: false,
      defaultValue: 'Random AI Story',
      options: {
        options: [
          { label: 'Random AI Story', value: 'Random AI Story' },
          { label: 'Custom', value: 'Custom' }
        ]
      }
    }),
    prompt: Property.LongText({
      displayName: 'Custom Prompt',
      description:
        "Prompt to generate a custom script (required when topic is 'Custom')",
      required: false
    }),
    voice: Property.ShortText({
      displayName: 'Voice',
      description: 'The voice for AI Video',
      required: false,
      defaultValue: 'Charlie'
    }),
    theme: Property.ShortText({
      displayName: 'Theme',
      description: 'To display captions with style',
      required: false,
      defaultValue: 'Hormozi_1'
    }),
    style: Property.ShortText({
      displayName: 'Style',
      description: 'AI image style',
      required: false,
      defaultValue: 'None'
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'To generate video in language you want',
      required: false,
      defaultValue: 'English'
    }),
    duration: Property.StaticDropdown({
      displayName: 'Duration',
      description: 'Video Duration',
      required: false,
      defaultValue: '30-60',
      options: {
        options: [
          { label: '30-60 seconds', value: '30-60' },
          { label: '60-90 seconds', value: '60-90' },
          { label: '90-120 seconds', value: '90-120' },
          { label: '5 minutes', value: '5 min' },
          { label: '10 minutes', value: '10 min' }
        ]
      }
    }),
    aspect_ratio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      description: 'Video aspect ratio',
      required: false,
      defaultValue: '9:16',
      options: {
        options: [
          { label: '9:16 (Portrait)', value: '9:16' },
          { label: '1:1 (Square)', value: '1:1' },
          { label: '16:9 (Landscape)', value: '16:9' }
        ]
      }
    }),
    custom_instruction: Property.LongText({
      displayName: 'Custom Instructions',
      description:
        'Custom instructions to guide AI (character descriptions, image visuals, background styles, etc.)',
      required: false
    }),
    use_ai: Property.StaticDropdown({
      displayName: 'Use AI to Modify Script',
      description: 'Modify script with AI',
      required: false,
      defaultValue: '1',
      options: {
        options: [
          { label: 'Yes', value: '1' },
          { label: 'No', value: '0' }
        ]
      }
    }),
    include_voiceover: Property.StaticDropdown({
      displayName: 'Include Voiceover',
      description: 'Include AI voiceover in the video',
      required: false,
      defaultValue: '1',
      options: {
        options: [
          { label: 'Yes', value: '1' },
          { label: 'No', value: '0' }
        ]
      }
    }),
    size: Property.ShortText({
      displayName: 'Caption Size',
      description: 'Size of captions (take reference values from dashboard)',
      required: false
    }),
    ypos: Property.ShortText({
      displayName: 'Caption Position',
      description:
        'Position of captions (take reference values from dashboard)',
      required: false
    }),
    url: Property.ShortText({
      displayName: 'Blog URL',
      description: 'URL input for Blog to Video',
      required: false
    }),
    bg_music: Property.ShortText({
      displayName: 'Background Music',
      description: 'Background music to use along with the video',
      required: false
    }),
    bg_music_volume: Property.Number({
      displayName: 'Background Music Volume',
      description: 'Background music volume (1-100)',
      required: false
    })
  },
  async run(context) {
    // Validate props with Zod schema
    await propsValidation.validateZod(context.propsValue, generateVideoSchema);

    const {
      topic,
      prompt,
      voice,
      theme,
      style,
      language,
      duration,
      aspect_ratio,
      custom_instruction,
      use_ai,
      include_voiceover,
      size,
      ypos,
      url,
      bg_music,
      bg_music_volume
    } = context.propsValue;

    // Validate custom prompt when topic is "Custom"
    if (topic === 'Custom' && !prompt) {
      throw new Error(
        "Custom prompt is required when topic is set to 'Custom'"
      );
    }

    // Build request body, only including non-empty values
    const requestBody: Record<string, any> = {};

    if (topic) requestBody['topic'] = topic;
    if (prompt) requestBody['prompt'] = prompt;
    if (voice) requestBody['voice'] = voice;
    if (theme) requestBody['theme'] = theme;
    if (style) requestBody['style'] = style;
    if (language) requestBody['language'] = language;
    if (duration) requestBody['duration'] = duration;
    if (aspect_ratio) requestBody['aspect_ratio'] = aspect_ratio;
    if (custom_instruction) requestBody['custom_instruction'] = custom_instruction;
    if (use_ai) requestBody['use_ai'] = use_ai;
    if (include_voiceover) requestBody['include_voiceover'] = include_voiceover;
    if (size) requestBody['size'] = size;
    if (ypos) requestBody['ypos'] = ypos;
    if (url) requestBody['url'] = url;
    if (bg_music) requestBody['bg_music'] = bg_music;
    if (bg_music_volume)
      requestBody['bg_music_volume'] = bg_music_volume.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://viralapi.vadoo.tv/api/generate_video',
      headers: {
        'X-API-KEY': context.auth,
        'Content-Type': 'application/json'
      },
      body: requestBody
    });

    return response.body;
  }
});

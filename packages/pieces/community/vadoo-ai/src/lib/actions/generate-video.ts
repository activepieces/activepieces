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
    topic: Property.Dropdown({
      displayName: 'Topic',
      description: 'To create content for AI Video',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://viralapi.vadoo.tv/api/get_topics',
            headers: {
              'X-API-KEY': auth as string
            }
          });

          const topics = response.body as string[];
          const options = topics.map(topic => ({
            label: topic,
            value: topic
          }));
          
          // Add Custom option
          options.push({ label: 'Custom', value: 'Custom' });
          
          return {
            disabled: false,
            options: options
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load topics'
          };
        }
      }
    }),
    prompt: Property.LongText({
      displayName: 'Custom Prompt',
      description:
        "Prompt to generate a custom script (required when topic is 'Custom')",
      required: false
    }),
    voice: Property.Dropdown({
      displayName: 'Voice',
      description: 'The voice for AI Video',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://viralapi.vadoo.tv/api/get_voices',
            headers: {
              'X-API-KEY': auth as string
            },
            timeout: 10000 // 10 second timeout
          });

          if (response.body && Array.isArray(response.body)) {
            const voices = response.body as string[];
            return {
              disabled: false,
              options: voices.map(voice => ({
                label: voice,
                value: voice
              }))
            };
          } else {
            // Fallback to default voices if API response is unexpected
            return {
              disabled: false,
              options: [
                { label: 'Charlie', value: 'Charlie' },
                { label: 'George', value: 'George' },
                { label: 'Callum', value: 'Callum' },
                { label: 'Sarah', value: 'Sarah' },
                { label: 'Laura', value: 'Laura' },
                { label: 'Charlotte', value: 'Charlotte' }
              ]
            };
          }
        } catch (error) {
          // Fallback to default voices on error
          return {
            disabled: false,
            options: [
              { label: 'Charlie', value: 'Charlie' },
              { label: 'George', value: 'George' },
              { label: 'Callum', value: 'Callum' },
              { label: 'Sarah', value: 'Sarah' },
              { label: 'Laura', value: 'Laura' },
              { label: 'Charlotte', value: 'Charlotte' }
            ]
          };
        }
      }
    }),
    theme: Property.Dropdown({
      displayName: 'Theme',
      description: 'To display captions with style',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://viralapi.vadoo.tv/api/get_themes',
            headers: {
              'X-API-KEY': auth as string
            }
          });

          const themes = response.body as string[];
          return {
            disabled: false,
            options: themes.map(theme => ({
              label: theme,
              value: theme
            }))
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load themes'
          };
        }
      }
    }),
    style: Property.ShortText({
      displayName: 'Style',
      description: 'AI image style',
      required: false,
      defaultValue: 'None'
    }),
    language: Property.Dropdown({
      displayName: 'Language',
      description: 'To generate video in language you want',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://viralapi.vadoo.tv/api/get_languages',
            headers: {
              'X-API-KEY': auth as string
            }
          });

          const languages = response.body as string[];
          return {
            disabled: false,
            options: languages.map(language => ({
              label: language,
              value: language
            }))
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load languages'
          };
        }
      }
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
    bg_music: Property.Dropdown({
      displayName: 'Background Music',
      description: 'Background music to use along with the video',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://viralapi.vadoo.tv/api/get_background_music',
            headers: {
              'X-API-KEY': auth as string
            }
          });

          const music = response.body as string[];
          return {
            disabled: false,
            options: music.map(track => ({
              label: track,
              value: track
            }))
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load background music'
          };
        }
      }
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

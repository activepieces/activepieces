import { httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { joggAiAuth } from '../..';

export const createVideoFromTemplate = createAction({
  name: 'createVideoFromTemplate',
  displayName: 'Create Video from Template',
  description: 'Creates a new video from templates',
  auth: joggAiAuth,
  props: {
    template_type: Property.StaticDropdown({
      displayName: 'Template Type',
      description: 'Template source type',
      required: true,
      options: {
        options: [
          { label: 'Common (Template Library)', value: 'common' },
          { label: 'User (My Templates)', value: 'user' },
        ],
      },
    }),
    template_id: Property.Dropdown({
      displayName: 'Template',
      description: 'Select a template to use',
      required: true,
      refreshers: ['template_type'],
      async options({ auth, template_type }) {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Jogg AI account first',
            options: [],
          };
        }

        if (!template_type) {
          return {
            disabled: true,
            placeholder: 'Select template type first',
            options: [],
          };
        }

        try {
          const endpoint = template_type === 'user' ? '/templates/custom' : '/templates';

          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `https://api.jogg.ai/v1${endpoint}`,
            headers: {
              'x-api-key': auth as string,
            },
          });

          const templates = response.body.data?.templates || [];
          return {
            options: templates.map((template: any) => ({
              label: template.name,
              value: template.id,
            })),
          };
        } catch (error) {
          console.error('Failed to fetch templates', error);
          return {
            options: [],
            placeholder: 'Unable to load templates',
          };
        }
      },
    }),
    lang: Property.ShortText({
      displayName: 'Language',
      description: 'Language for text-to-speech conversion',
      required: true,
      defaultValue: 'english',
    }),
    variables: Property.LongText({
      displayName: 'Variables (JSON)',
      description: 'Variables to replace in the template as JSON array',
      required: true,
      defaultValue: '[{"type":"text","name":"variable_name","properties":{"content":"replacement text"}}]',
    }),
    avatar_id: Property.Number({
      displayName: 'Avatar ID',
      description: 'Digital person ID (optional)',
      required: false,
    }),
    avatar_type: Property.StaticDropdown({
      displayName: 'Avatar Type',
      description: 'Avatar source type',
      required: false,
      options: {
        options: [
          { label: 'Public avatars', value: 0 },
          { label: 'Custom avatars', value: 1 },
        ],
      },
    }),
    voice_id: Property.ShortText({
      displayName: 'Voice ID',
      description: 'Voice ID for text-to-speech (optional)',
      required: false,
    }),
    caption: Property.Checkbox({
      displayName: 'Enable Captions',
      description: 'Whether to enable captions',
      required: false,
      defaultValue: true,
    }),
    music_id: Property.Number({
      displayName: 'Music ID',
      description: 'Background music ID (optional)',
      required: false,
    }),
    video_name: Property.ShortText({
      displayName: 'Video Name',
      description: 'Name of the generated video (optional)',
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const {
      template_type,
      template_id,
      lang,
      variables,
      avatar_id,
      avatar_type,
      voice_id,
      caption,
      music_id,
      video_name,
    } = propsValue;

    // Zod validation
    await propsValidation.validateZod(propsValue, {
      template_id: z.number().min(1, 'Template ID is required'),
      lang: z.string().min(1, 'Language is required'),
      variables: z.string().min(1, 'Variables are required'),
    });

    // Parse variables JSON
    let parsedVariables;
    try {
      parsedVariables = JSON.parse(variables);
    } catch (error) {
      throw new Error('Variables must be valid JSON');
    }

    const requestBody: any = {
      template_id,
      lang,
      template_type,
      variables: parsedVariables,
    };

    // Add optional parameters if provided
    if (avatar_id !== undefined) {
      requestBody.avatar_id = avatar_id;
    }
    if (avatar_type !== undefined) {
      requestBody.avatar_type = avatar_type;
    }
    if (voice_id) {
      requestBody.voice_id = voice_id;
    }
    if (caption !== undefined) {
      requestBody.caption = caption;
    }
    if (music_id !== undefined) {
      requestBody.music_id = music_id;
    }
    if (video_name) {
      requestBody.video_name = video_name;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.jogg.ai/v1/create_video_with_template',
      headers: {
        'x-api-key': auth,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    return response.body;
  },
});

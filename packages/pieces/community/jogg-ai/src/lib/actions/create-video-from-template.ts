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
      refreshers: [],
      async options({ auth }) {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Jogg AI account first',
            options: [],
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://api.jogg.ai/v1/templates',
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
    variables: Property.Array({
      displayName: 'Variables',
      description: 'Variables to replace in the template',
      required: false,
      defaultValue: [],
      properties: {
        type: Property.StaticDropdown({
          displayName: 'Variable Type',
          description: 'Type of variable content',
          required: true,
          options: {
            options: [
              { label: 'Text content', value: 'text' },
              { label: 'Image content', value: 'image' },
              { label: 'Video content', value: 'video' },
              { label: 'Script content', value: 'script' },
            ],
          },
        }),
        name: Property.ShortText({
          displayName: 'Variable Name',
          description: 'Name of the variable to replace',
          required: true,
        }),
        properties: Property.LongText({
          displayName: 'Properties (JSON)',
          description: 'Properties for the variable as JSON object',
          required: true,
          defaultValue: '{"content": "replacement text"}',
        }),
      },
    }),
    avatar_id: Property.Dropdown({
      displayName: 'Avatar ID',
      description: 'Select an avatar to use',
      required: false,
      refreshers: [],
      async options({ auth }) {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Jogg AI account first',
            options: [],
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://api.jogg.ai/v1/avatars',
            headers: {
              'x-api-key': auth as string,
            },
          });

          const avatars = response.body.data?.avatars || [];
          return {
            options: avatars.map((avatar: any) => ({
              label: avatar.name,
              value: avatar.avatar_id,
            })),
          };
        } catch (error) {
          console.error('Failed to fetch avatars', error);
          return {
            options: [],
            placeholder: 'Unable to load avatars',
          };
        }
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
      voice_id,
      caption,
      music_id,
      video_name,
    } = propsValue;

    // Zod validation
    await propsValidation.validateZod(propsValue, {
      template_id: z.number().min(1, 'Template ID is required'),
      lang: z.string().min(1, 'Language is required'),
      variables: z.array(z.object({
        type: z.enum(['text', 'image', 'video', 'script']),
        name: z.string().min(1, 'Variable name is required'),
        properties: z.string().min(1, 'Properties are required'),
      })).optional(),
    });

    // Parse properties JSON for each variable
    const processedVariables = (variables && variables.length > 0)
      ? variables.map((variable: any) => ({
          type: variable.type,
          name: variable.name,
          properties: JSON.parse(variable.properties),
        }))
      : [];

    const requestBody: any = {
      template_id,
      lang,
      template_type,
      variables: processedVariables,
    };

    // Add optional parameters if provided
    if (avatar_id !== undefined) {
      requestBody.avatar_id = avatar_id;
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

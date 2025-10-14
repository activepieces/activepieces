import {
  httpClient,
  HttpMethod,
  propsValidation,
} from '@activepieces/pieces-common';
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

        try {
          let url = 'https://api.jogg.ai/v1/templates';
          if (template_type === 'user') {
            url = 'https://api.jogg.ai/v1/templates/custom';
          }

          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url,
            headers: {
              'x-api-key': auth as string,
            },
          });

          if (response.body.code !== 0) {
            return {
              options: [],
              placeholder: `Error loading templates: ${response.body.msg}`,
            };
          }

          const templates = response.body.data?.templates || [];
          return {
            options: templates.map(
              (template: { id: number; name: string }) => ({
                label: template.name,
                value: template.id,
              })
            ),
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
          description:
            'Name of the variable to replace (as defined in template)',
          required: true,
        }),
        content: Property.LongText({
          displayName: 'Content',
          description: 'Content for text/script variables',
          required: false,
        }),
        url: Property.ShortText({
          displayName: 'URL',
          description: 'URL for image/video variables',
          required: false,
        }),
      },
    }),
    avatar_type: Property.StaticDropdown({
      displayName: 'Avatar Type',
      description: 'Source type of the avatar',
      required: false,
      options: {
        options: [
          { label: 'Public avatars', value: 0 },
          { label: 'Custom avatars', value: 1 },
        ],
      },
    }),
    avatar_id: Property.Dropdown({
      displayName: 'Avatar',
      description: 'Select an avatar to use',
      required: false,
      refreshers: ['avatar_type'],
      async options({ auth, avatar_type }) {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Jogg AI account first',
            options: [],
          };
        }

        try {
          let url = 'https://api.jogg.ai/v1/avatars';
          if (avatar_type === 1) {
            url = 'https://api.jogg.ai/v1/avatars/custom';
          }

          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url,
            headers: {
              'x-api-key': auth as string,
            },
          });

          if (response.body.code !== 0) {
            return {
              options: [],
              placeholder: `Error loading avatars: ${response.body.msg}`,
            };
          }

          const avatars = response.body.data?.avatars || [];
          return {
            options: avatars.map(
              (avatar: { avatar_id: number; name: string }) => ({
                label: avatar.name,
                value: avatar.avatar_id,
              })
            ),
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
      avatar_type,
      avatar_id,
      voice_id,
      caption,
      music_id,
      video_name,
    } = propsValue;

    await propsValidation.validateZod(propsValue, {
      template_id: z.number().min(1, 'Template ID is required'),
      lang: z.string().min(1, 'Language cannot be empty'),
      video_name: z.string().min(1, 'Video name cannot be empty').optional(),
      variables: z
        .array(
          z.object({
            type: z.enum(['text', 'image', 'video', 'script']),
            name: z.string().min(1, 'Variable name is required'),
            content: z.string().optional(),
            url: z.string().url('URL must be valid').optional(),
          })
        )
        .optional(),
    });

    const processedVariables =
      variables && variables.length > 0
        ? (
            variables as Array<{
              type: string;
              name: string;
              content?: string;
              url?: string;
            }>
          ).map((variable) => {
            const properties: { content?: string; url?: string } = {};

            if (variable.type === 'text' || variable.type === 'script') {
              if (!variable.content) {
                throw new Error(
                  `Content is required for ${variable.type} variables`
                );
              }
              properties.content = variable.content;
            } else if (variable.type === 'image' || variable.type === 'video') {
              if (!variable.url) {
                throw new Error(
                  `URL is required for ${variable.type} variables`
                );
              }
              properties.url = variable.url;
            }

            return {
              type: variable.type,
              name: variable.name,
              properties,
            };
          })
        : [];

    const requestBody: {
      template_id: number;
      lang: string;
      template_type: string;
      variables: Array<{
        type: string;
        name: string;
        properties: { content?: string; url?: string };
      }>;
      avatar_id?: number;
      avatar_type?: number;
      voice_id?: string;
      caption?: boolean;
      music_id?: number;
      video_name?: string;
    } = {
      template_id,
      lang,
      template_type,
      variables: processedVariables,
    };

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

    if (response.body.code !== 0) {
      const errorMessages: Record<number, string> = {
        10104: 'Record not found',
        10105: 'Invalid API key',
        18020: 'Insufficient credit',
        18025: 'No permission to call APIs',
        40000: 'Parameter error',
        50000: 'System error',
      };

      const message =
        errorMessages[response.body.code] || `API Error: ${response.body.msg}`;
      throw new Error(message);
    }

    return response.body;
  },
});

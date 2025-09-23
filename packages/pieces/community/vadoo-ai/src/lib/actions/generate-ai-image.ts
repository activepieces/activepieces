import { createAction, Property } from '@activepieces/pieces-framework';
import { vadooAiAuth } from '../../index';
import { httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { generateAiImageSchema } from '../schemas';

export const generateAiImage = createAction({
  auth: vadooAiAuth,
  name: 'generate_ai_image',
  displayName: 'Generate AI Image',
  description: 'Generates AI generated image based on prompt for a character',
  props: {
    id: Property.Dropdown({
      displayName: 'Character',
      description: 'Select the character to generate an image for',
      required: true,
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
            url: 'https://viralapi.vadoo.tv/api/get_all_characters',
            headers: {
              'X-API-KEY': auth as string
            }
          });

          const characters = response.body as Array<{
            id: number;
            name: string;
            url: string;
            createdAt: string;
          }>;

          return {
            disabled: false,
            options: characters.map(character => ({
              label: `${character.name} (ID: ${character.id})`,
              value: character.id.toString()
            }))
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load characters'
          };
        }
      }
    }),
    ratio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      description: 'The aspect ratio for the generated image',
      required: true,
      options: {
        options: [
          { label: '9:16 (Portrait)', value: '9:16' },
          { label: '1:1 (Square)', value: '1:1' },
          { label: '16:9 (Landscape)', value: '16:9' },
          { label: '3:4 (Portrait)', value: '3:4' },
          { label: '4:3 (Landscape)', value: '4:3' }
        ]
      }
    }),
    style: Property.Dropdown({
      displayName: 'Image Style',
      description: 'AI image style/theme for the generated image',
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
            url: 'https://viralapi.vadoo.tv/api/get_styles',
            headers: {
              'X-API-KEY': auth as string
            }
          });

          const styles = response.body as string[];
          return {
            disabled: false,
            options: styles.map(style => ({
              label: style,
              value: style
            }))
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load styles'
          };
        }
      }
    }),
    prompt: Property.LongText({
      displayName: 'Image Prompt',
      description: 'Prompt to generate a character image',
      required: true
    })
  },
  async run(context) {
    // Validate props with Zod schema
    await propsValidation.validateZod(context.propsValue, generateAiImageSchema);

    const { id, ratio, style, prompt } = context.propsValue;

    // Build request body
    const requestBody: Record<string, any> = {
      id: parseInt(id as string, 10),
      ratio: ratio,
      prompt: prompt
    };

    if (style) requestBody['style'] = style;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://viralapi.vadoo.tv/api/generate_character_image',
      headers: {
        'X-API-KEY': context.auth,
        'Content-Type': 'application/json'
      },
      body: requestBody
    });

    return response.body;
  }
});
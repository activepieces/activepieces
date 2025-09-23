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
    id: Property.Number({
      displayName: 'Character ID',
      description: 'The ID of the character to generate an image for',
      required: true
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
    prompt: Property.LongText({
      displayName: 'Image Prompt',
      description: 'Prompt to generate a character image',
      required: true
    })
  },
  async run(context) {
    // Validate props with Zod schema
    await propsValidation.validateZod(context.propsValue, generateAiImageSchema);

    const { id, ratio, prompt } = context.propsValue;

    // Build request body
    const requestBody = {
      id: id,
      ratio: ratio,
      prompt: prompt
    };

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
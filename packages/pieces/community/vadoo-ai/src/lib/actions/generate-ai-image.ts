import { createAction, Property } from '@activepieces/pieces-framework';
import { vadooAiAuth } from '../common/auth';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = "https://viralapi.vadoo.tv/api";

export const generateAiImage = createAction({
  auth: vadooAiAuth,
  name: 'generate_character_image',
  displayName: 'Generate AI Image',
  description: 'Generates an AI-generated image based on a prompt.',
  props: {
    id: Property.Number({
        displayName: 'Character ID',
        description: 'The ID of the character for whom to generate an image.',
        required: true,
    }),
    prompt: Property.LongText({
        displayName: 'Prompt',
        description: 'A detailed description of the image to generate.',
        required: true,
    }),
    ratio: Property.StaticDropdown({
        displayName: 'Aspect Ratio',
        description: 'The desired aspect ratio for the generated image.',
        required: true,
        options: {
            options: [
                { label: 'Portrait (9:16)', value: '9:16' },
                { label: 'Square (1:1)', value: '1:1' },
                { label: 'Landscape (16:9)', value: '16:9' },
                { label: 'Portrait (3:4)', value: '3:4' },
                { label: 'Landscape (4:3)', value: '4:3' },
            ]
        }
    }),
  },
  async run(context) {
    const body = context.propsValue;

    const response = await httpClient.sendRequest<{ id: number }>({
        method: HttpMethod.POST,
        url: `${BASE_URL}/generate_character_image`,
        headers: {
            'X-API-KEY': context.auth.apiKey,
        },
        body: body,
    });

    return response.body;
  },
});
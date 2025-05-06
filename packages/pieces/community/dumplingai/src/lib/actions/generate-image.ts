import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingaiAuth } from '../../index';
import { BASE_URL, apiHeaders } from '../common/common';

export const generateImage = createAction({
  name: 'generate_image',
  displayName: 'Generate Image',
  description: 'Create images from text prompts',
  auth: dumplingaiAuth,
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'The text prompt to generate an image from',
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: false,
      description: 'The AI model to use for image generation',
      defaultValue: 'FLUX.1_Schnell',
      options: {
        options: [
          { label: 'FLUX.1 Schnell (Fastest)', value: 'FLUX.1_Schnell' },
          { label: 'FLUX.1 Dev (Better Quality)', value: 'FLUX.1_Dev' },
          { label: 'FLUX.1 Pro (Best Quality)', value: 'FLUX.1_Pro' },
          { label: 'Recraft V3', value: 'Recraft_V3' },
        ],
      },
    }),
    width: Property.Number({
      displayName: 'Width',
      required: false,
      description: 'The width of the generated image',
      defaultValue: 512,
    }),
    height: Property.Number({
      displayName: 'Height',
      required: false,
      description: 'The height of the generated image',
      defaultValue: 512,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/image/generate`,
      headers: apiHeaders(auth),
      body: {
        prompt: propsValue.prompt,
        model: propsValue.model,
        width: propsValue.width,
        height: propsValue.height,
      },
    });

    return response.body;
  },
}); 
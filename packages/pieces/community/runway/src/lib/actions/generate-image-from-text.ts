import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { runwayAuth } from '../..';

export const generateImageFromText = createAction({
  auth: runwayAuth,
  name: 'generate-image-from-text',
  displayName: 'Generate Image From Text',
  description: 'Generates an image using a text prompt via Runway\'s AI models.',
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'The text prompt to generate the image from.',
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: false,
      description: 'The AI model to use for image generation.',
      options: {
        options: [
          {
            label: 'Gen-3 Alpha',
            value: 'gen-3-alpha',
          },
          {
            label: 'Gen-2',
            value: 'gen-2',
          },
          {
            label: 'Gen-1',
            value: 'gen-1',
          },
        ],
      },
    }),
    width: Property.Number({
      displayName: 'Width',
      description: 'Width of the generated image in pixels.',
      required: false,
      defaultValue: 1024,
    }),
    height: Property.Number({
      displayName: 'Height',
      description: 'Height of the generated image in pixels.',
      required: false,
      defaultValue: 1024,
    }),
    seed: Property.Number({
      displayName: 'Seed',
      description: 'Random seed for reproducible results.',
      required: false,
    }),
    ratio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      required: false,
      description: 'Aspect ratio for the generated image.',
      options: {
        options: [
          {
            label: '16:9',
            value: '16:9',
          },
          {
            label: '1:1',
            value: '1:1',
          },
          {
            label: '9:16',
            value: '9:16',
          },
          {
            label: '4:3',
            value: '4:3',
          },
          {
            label: '3:4',
            value: '3:4',
          },
        ],
      },
    }),
  },
  async run(context) {
    const {
      prompt,
      model,
      width,
      height,
      seed,
      ratio,
    } = context.propsValue;

    const requestBody: any = {
      prompt,
      model: model || 'gen-3-alpha',
    };

    if (width) requestBody.width = width;
    if (height) requestBody.height = height;
    if (seed !== undefined) requestBody.seed = seed;
    if (ratio) requestBody.ratio = ratio;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://api.runwayml.com/v1/image_generation',
      headers: {
        Authorization: `Bearer ${context.auth.api_key}`,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    };

    const response = await httpClient.sendRequest(request);

    if (response.body && response.body.image_url) {
      const imageResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: response.body.image_url,
        responseType: 'arraybuffer',
      });

      return context.files.write({
        data: Buffer.from(imageResponse.body),
        fileName: `runway-image-${Date.now()}.png`,
      });
    }

    return response.body;
  },
});

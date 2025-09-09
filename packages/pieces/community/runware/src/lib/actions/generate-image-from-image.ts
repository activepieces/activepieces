import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import crypto from 'crypto';
import { runwareAuth } from '../common/auth';

export const generateImageFromImage = createAction({
  name: 'generate_image_from_image',
  displayName: 'Generate Images from Existing Image',
  description: 'Generate new images based on a provided image (image-to-image).',
  auth: runwareAuth,
  props: {
    seedImage: Property.LongText({
      displayName: 'Seed Image',
      description: 'The starting image for the transformation. Can be a public URL, a base64 encoded string, or a data URI.',
      required: true,
    }),
    strength: Property.Number({
        displayName: 'Strength',
        description: 'Determines the influence of the seed image. A lower value preserves the original more, while a higher value allows more creative deviation. Must be between 0 and 1.',
        required: true,
        defaultValue: 0.8,
    }),
    positivePrompt: Property.LongText({
      displayName: 'Prompt',
      description: 'A detailed description of the transformation you want to apply.',
      required: true,
    }),
    // UPDATED: Changed from ShortText to a StaticDropdown for user-friendliness
    model: Property.StaticDropdown({
        displayName: 'Model',
        description: 'The AI model to use for generation. SDXL or SD 1.5 models are recommended for fine-grained control.',
        required: true,
        options: {
            options: [
                { label: 'Juggernaut XL XI (SDXL)', value: 'civitai:133005@782002' },
                { label: 'Dreamshaper (SD 1.5)', value: 'civitai:4384@128713' },
                { label: 'FLUX.1 Dev', value: 'runware:101@1' },
            ]
        },
        defaultValue: 'civitai:133005@782002',
    }),
    negativePrompt: Property.LongText({
      displayName: 'Negative Prompt',
      description: 'Describe what you want to avoid in the transformed image.',
      required: false,
    }),
    width: Property.Number({
      displayName: 'Width',
      description: 'The width of the output image in pixels. Must be divisible by 64.',
      required: true,
      defaultValue: 1024,
    }),
    height: Property.Number({
      displayName: 'Height',
      description: 'The height of the output image in pixels. Must be divisible by 64.',
      required: true,
      defaultValue: 1024,
    }),
    steps: Property.Number({
      displayName: 'Steps',
      description: 'Number of iterations for the model. Only a portion are used, depending on the strength.',
      required: false,
    }),
    CFGScale: Property.Number({
        displayName: 'CFG Scale',
        description: 'How strictly the model follows your prompt. Higher values are stricter.',
        required: false,
    }),
    scheduler: Property.ShortText({
        displayName: 'Scheduler',
        description: 'The algorithm used to guide the image generation process (e.g., "DDIM").',
        required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const payload = {
      taskType: 'imageInference',
      taskUUID: crypto.randomUUID(),
      seedImage: propsValue.seedImage,
      strength: propsValue.strength,
      positivePrompt: propsValue.positivePrompt,
      model: propsValue.model,
      width: propsValue.width,
      height: propsValue.height,
      ...(propsValue.negativePrompt && { negativePrompt: propsValue.negativePrompt }),
      ...(propsValue.steps && { steps: propsValue.steps }),
      ...(propsValue.CFGScale && { CFGScale: propsValue.CFGScale }),
      ...(propsValue.scheduler && { scheduler: propsValue.scheduler }),
    };

    const response = await httpClient.sendRequest<{
      data: unknown[];
    }>({
      url: 'https://api.runware.ai/v1',
      method: HttpMethod.POST,
      body: [payload],
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
    });

    return response.body.data;
  },
});
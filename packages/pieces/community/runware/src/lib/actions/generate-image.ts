import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import crypto from 'crypto';
import { runwareAuth } from '../common/auth';

export const generateImageFromText = createAction({
  name: 'generate_image_from_text',
  displayName: 'Generate Images from Text',
  description: 'Produce images from a text description.',
  auth: runwareAuth,
  props: {
    positivePrompt: Property.LongText({
      displayName: 'Prompt',
      description: 'A detailed description of the image you want to generate.',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The AI model to use for image generation.',
      required: true,
      options: {
        options: [
          { label: 'FLUX.1 Dev', value: 'runware:101@1' },
          { label: 'Juggernaut XL XI (SDXL)', value: 'civitai:133005@782002' },
          { label: 'Dreamshaper (SD 1.5)', value: 'civitai:4384@128713' },
        ],
      },
      defaultValue: 'runware:101@1',
    }),
    negativePrompt: Property.LongText({
      displayName: 'Negative Prompt',
      description: 'Describe what you want to avoid in the image.',
      required: false,
    }),
    width: Property.Number({
      displayName: 'Width',
      description: 'The width of the image in pixels. Must be divisible by 64.',
      required: true,
      defaultValue: 1024,
    }),
    height: Property.Number({
      displayName: 'Height',
      description: 'The height of the image in pixels. Must be divisible by 64.',
      required: true,
      defaultValue: 1024,
    }),
    steps: Property.Number({
      displayName: 'Steps',
      description: 'Number of iterations for the model. Higher values mean more detail but take longer.',
      required: false,
    }),
    CFGScale: Property.Number({
        displayName: 'CFG Scale',
        description: 'How strictly the model follows your prompt. Higher values are stricter.',
        required: false,
    }),
    seed: Property.Number({
        displayName: 'Seed',
        description: 'A number to control randomness. Using the same seed with the same settings will produce the same image.',
        required: false,
    }),
    scheduler: Property.ShortText({
        displayName: 'Scheduler',
        description: 'The algorithm used to guide the image generation process (e.g., "DPM++ 2M Karras").',
        required: false,
    }),
    clipSkip: Property.Number({
        displayName: 'Clip Skip',
        description: 'Controls which layer of the text encoder is used to interpret the prompt. Affects style and composition.',
        required: false,
    }),
    vae: Property.ShortText({
        displayName: 'VAE',
        description: 'The AIR identifier for a specific VAE model to override the default.',
        required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    
    const payload = {
      taskType: 'imageInference',
      taskUUID: crypto.randomUUID(),
      positivePrompt: propsValue.positivePrompt,
      model: propsValue.model,
      width: propsValue.width,
      height: propsValue.height,
      ...(propsValue.negativePrompt && { negativePrompt: propsValue.negativePrompt }),
      ...(propsValue.steps && { steps: propsValue.steps }),
      ...(propsValue.CFGScale && { CFGScale: propsValue.CFGScale }),
      ...(propsValue.seed && { seed: propsValue.seed }),
      ...(propsValue.scheduler && { scheduler: propsValue.scheduler }),
      ...(propsValue.clipSkip && { clipSkip: propsValue.clipSkip }),
      ...(propsValue.vae && { vae: propsValue.vae }),
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
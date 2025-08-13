import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';

export const createImage = createAction({
  name: 'create_image',
  auth: huggingFaceAuth,
  displayName: 'Create Image',
  description: 'Generate an image from a text prompt using a compatible Hugging Face diffusion or image generation model',
  props: {
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Hugging Face image generation model to use',
      required: true,
      defaultValue: 'stabilityai/stable-diffusion-2-1',
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Text description of the image you want to generate',
      required: true,
    }),
    negativePrompt: Property.LongText({
      displayName: 'Negative Prompt',
      description: 'Text description of what you don\'t want in the image',
      required: false,
    }),
    numInferenceSteps: Property.Number({
      displayName: 'Number of Inference Steps',
      description: 'Number of denoising steps (higher = better quality but slower)',
      required: false,
      defaultValue: 50,
    }),
    guidanceScale: Property.Number({
      displayName: 'Guidance Scale',
      description: 'How closely to follow the prompt (higher = more closely)',
      required: false,
      defaultValue: 7.5,
    }),
  },
  async run(context) {
    const { apiKey, baseUrl } = context.auth;
    const { model, prompt, negativePrompt, numInferenceSteps, guidanceScale } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/models/${model}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        inputs: prompt,
        parameters: {
          negative_prompt: negativePrompt,
          num_inference_steps: numInferenceSteps,
          guidance_scale: guidanceScale,
        },
      },
    });

    return response.body;
  },
}); 
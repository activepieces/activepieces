import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';

export const createImage = createAction({
  name: 'create_image',
  auth: huggingFaceAuth,
  displayName: 'Create Image',
  description: 'Generate images from text prompts using AI diffusion models',
  props: {
    prompt: Property.LongText({
      displayName: 'Image Prompt',
      description: 'Text description of the image you want to generate',
      required: true,
    }),
    negativePrompt: Property.LongText({
      displayName: 'Negative Prompt (Optional)',
      description: 'Text describing what you don\'t want in the image',
      required: false,
    }),
    width: Property.Number({
      displayName: 'Image Width',
      description: 'Width of the generated image in pixels',
      required: false,
      defaultValue: 512,
    }),
    height: Property.Number({
      displayName: 'Image Height',
      description: 'Height of the generated image in pixels',
      required: false,
      defaultValue: 512,
    }),
    numInferenceSteps: Property.Number({
      displayName: 'Inference Steps',
      description: 'Number of denoising steps (higher = better quality, slower)',
      required: false,
      defaultValue: 50,
    }),
    guidanceScale: Property.Number({
      displayName: 'Guidance Scale',
      description: 'How closely to follow the prompt (higher = more closely)',
      required: false,
      defaultValue: 7.5,
    }),
    seed: Property.Number({
      displayName: 'Seed (Optional)',
      description: 'Random seed for reproducible results',
      required: false,
    }),
    model: Property.ShortText({
      displayName: 'Model (Optional)',
      description: 'Specific image generation model to use (overrides auth model)',
      required: false,
    }),
  },
  async run(context) {
    const model = context.propsValue.model || context.auth.model;
    const accessToken = context.auth.accessToken;
    
    const parameters: any = {};
    
    if (context.propsValue.negativePrompt) {
      parameters.negative_prompt = context.propsValue.negativePrompt;
    }
    if (context.propsValue.width) {
      parameters.width = context.propsValue.width;
    }
    if (context.propsValue.height) {
      parameters.height = context.propsValue.height;
    }
    if (context.propsValue.numInferenceSteps) {
      parameters.num_inference_steps = context.propsValue.numInferenceSteps;
    }
    if (context.propsValue.guidanceScale) {
      parameters.guidance_scale = context.propsValue.guidanceScale;
    }
    if (context.propsValue.seed !== undefined) {
      parameters.seed = context.propsValue.seed;
    }
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: context.propsValue.prompt,
        parameters,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  },
}); 
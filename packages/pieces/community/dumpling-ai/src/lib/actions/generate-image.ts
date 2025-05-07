import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';

// Model options with descriptions
const MODEL_OPTIONS = [
  {
    label: 'FLUX.1-schnell (Fast, 3 credits/image)',
    value: 'FLUX.1-schnell',
    description: 'Fastest model with good quality for most use cases'
  },
  {
    label: 'FLUX.1-dev (High Quality, 25 credits/image)',
    value: 'FLUX.1-dev',
    description: 'Higher quality model with better details and composition'
  },
  {
    label: 'FLUX.1-pro (Premium, 50 credits/image)',
    value: 'FLUX.1-pro',
    description: 'Professional-grade model with exceptional quality and detail'
  },
];

// Image size options with dimensions
const SIZE_OPTIONS = [
  { label: 'Square HD (1024×1024)', value: 'square_hd' },
  { label: 'Square (512×512)', value: 'square' },
  { label: 'Portrait 4:3 (768×1024)', value: 'portrait_4_3' },
  { label: 'Portrait 16:9 (576×1024)', value: 'portrait_16_9' },
  { label: 'Landscape 4:3 (1024×768)', value: 'landscape_4_3' },
  { label: 'Landscape 16:9 (1024×576)', value: 'landscape_16_9' },
];

/**
 * Generate Image Action
 *
 * Creates AI-generated images based on text prompts using Dumpling AI's
 * image generation capabilities.
 */
export const generateImage = createAction({
  name: 'generate_image',
  displayName: 'Create AI Image',
  description: 'Generate custom images from text descriptions using advanced AI models',
  auth: dumplingAuth,

  props: {
    // Prompt guidance
    promptHelp: Property.MarkDown({
      value: `### Writing Effective Prompts
For best results:
- Be specific and detailed about what you want
- Describe style, lighting, mood, and composition
- Mention artists or art styles for particular looks
- Example: "A serene mountain lake at sunset with snow-capped peaks reflected in still water, golden hour lighting, photorealistic style"`,
    }),

    // Main prompt input
    prompt: Property.LongText({
      displayName: 'Image Description',
      required: true,
      description: 'Describe in detail what image you want to generate',
    }),

    // Model selection
    modelSection: Property.MarkDown({
      value: '### Model Settings',
    }),

    model: Property.StaticDropdown({
      displayName: 'AI Model',
      required: false,
      description: 'Select which AI model to use for generation',
      defaultValue: 'FLUX.1-schnell',
      options: {
        options: MODEL_OPTIONS,
      },
    }),

    // Image configuration
    imageConfig: Property.MarkDown({
      value: '### Image Configuration',
    }),

    image_size: Property.StaticDropdown({
      displayName: 'Image Size & Orientation',
      required: false,
      description: 'Choose the dimensions and aspect ratio',
      defaultValue: 'landscape_4_3',
      options: {
        options: SIZE_OPTIONS,
      },
    }),

    num_images: Property.Number({
      displayName: 'Number of Variations',
      required: false,
      defaultValue: 1,
      description: 'Generate multiple variations of the same prompt (1-4)',
    }),

    // Advanced settings
    advancedSection: Property.MarkDown({
      value: '### Advanced Settings (Optional)',
    }),

    num_inference_steps: Property.Number({
      displayName: 'Quality Steps',
      required: false,
      description: 'Higher values (20-50) create more detailed images but take longer',
    }),

    seed: Property.Number({
      displayName: 'Random Seed',
      required: false,
      description: 'Set a specific seed to make results reproducible',
    }),
  },

  async run(context) {
    // Extract properties from context
    const {
      model,
      prompt,
      image_size,
      num_inference_steps,
      seed,
      num_images
    } = context.propsValue;

    // Validate and prepare the prompt
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Image description cannot be empty');
    }

    // Build request body
    const requestBody = {
      // Required parameter
      prompt: prompt.trim(),

      // Optional parameters with defaults
      model: model || 'FLUX.1-schnell',
      image_size: image_size || 'landscape_4_3',

      // Optional numeric parameters
      ...(num_inference_steps && { num_inference_steps: Math.min(Math.max(10, num_inference_steps), 50) }),
      ...(seed !== undefined && { seed: seed }),
      ...(num_images && { num_images: Math.min(Math.max(1, num_images), 4) })
    };

    try {
      // Send request to Dumpling AI API
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://app.dumplingai.com/api/v1/generate-image',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.auth}`,
          'User-Agent': 'Activepieces-DumplingAI-Integration/1.0'
        },
        body: requestBody,
      });

      // Process and return the response
      const result = response.body;

      // Add helpful metadata to the response
      return {
        ...result,
        _metadata: {
          model_used: model || 'FLUX.1-schnell',
          prompt_used: prompt.trim(),
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Image generation failed: ${errorMessage}`);
    }
  },
});

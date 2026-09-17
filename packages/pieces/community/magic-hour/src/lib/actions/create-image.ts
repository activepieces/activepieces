import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { magicHourAuth } from '../auth';
import { magicHourApi } from '../common/client';

export const createImageAction = createAction({
  auth: magicHourAuth,
  name: 'create_image',
  classification: 'WRITE',
  displayName: 'Create Image',
  description: 'Start an AI image generation job from a text prompt.',
  audience: 'both',
  aiMetadata: {
    description:
      'Start a credit-consuming Magic Hour text-to-image job and return its project ID. Use Get Project with type Image to retrieve status and downloads. Each retry starts another generation.',
    idempotent: false,
  },
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe the image to generate.',
      required: true,
    }),
    image_count: Property.Number({
      displayName: 'Image Count',
      description:
        'Number of images to generate. Model-specific limits may be lower.',
      required: true,
      defaultValue: 1,
      display: 'stepper',
      min: 1,
      max: 16,
      step: 1,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description:
        'Use Default unless the workflow requires a specific Magic Hour model.',
      required: true,
      defaultValue: 'default',
      options: {
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Nano Banana 2', value: 'nano-banana-2' },
          { label: 'GPT Image 2', value: 'gpt-image-2' },
          { label: 'GPT Image 2.5 Flare', value: 'gpt-image-2.5-flare' },
          { label: 'Z-Image Turbo', value: 'z-image-turbo' },
          { label: 'Flux 2 Klein', value: 'flux-2-klein' },
          { label: 'Nano Banana 2 Lite', value: 'nano-banana-2-lite' },
          { label: 'Krea 2', value: 'krea-2' },
          { label: 'Seedream v4', value: 'seedream-v4' },
          { label: 'Seedream v5 Pro', value: 'seedream-v5-pro' },
          { label: 'Nano Banana', value: 'nano-banana' },
          { label: 'Nano Banana Pro', value: 'nano-banana-pro' },
          { label: 'Flux Schnell', value: 'flux-schnell' },
        ],
      },
    }),
    aspect_ratio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      description: 'Shape of the generated image.',
      required: true,
      defaultValue: '1:1',
      display: 'cards',
      options: {
        options: [
          { label: 'Square', value: '1:1', description: '1:1' },
          { label: 'Landscape', value: '16:9', description: '16:9' },
          { label: 'Portrait', value: '9:16', description: '9:16' },
        ],
      },
    }),
    resolution: Property.StaticDropdown({
      displayName: 'Resolution',
      description: 'Output resolution. Availability depends on the model.',
      required: true,
      defaultValue: 'auto',
      options: {
        options: [
          { label: 'Automatic', value: 'auto' },
          { label: '640px', value: '640px' },
          { label: '1K', value: '1k' },
          { label: '2K', value: '2k' },
          { label: '4K', value: '4k' },
        ],
      },
    }),
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'Optional name shown in the Magic Hour project list.',
      required: false,
      advanced: true,
    }),
  },
  async run(context) {
    return magicHourApi.call({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/ai-image-generator',
      body: {
        image_count: context.propsValue.image_count,
        model: context.propsValue.model,
        aspect_ratio: context.propsValue.aspect_ratio,
        resolution: context.propsValue.resolution,
        style: {
          prompt: context.propsValue.prompt,
          tool: 'general',
        },
        ...(context.propsValue.name
          ? { name: context.propsValue.name }
          : {}),
      },
    });
  },
});

import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { magicHourAuth } from '../auth';
import { magicHourApi } from '../common/client';

export const editImageAction = createAction({
  auth: magicHourAuth,
  name: 'edit_image',
  classification: 'WRITE',
  displayName: 'Edit Image',
  description: 'Start an AI image editing job from source images and a prompt.',
  audience: 'both',
  aiMetadata: {
    description:
      'Start a credit-consuming Magic Hour image-editing job using one or more direct image URLs or Magic Hour file paths. Use Get Project with type Image for completion and downloads. Each retry starts another generation.',
    idempotent: false,
  },
  props: {
    image_file_paths: Property.Array({
      displayName: 'Source Images',
      description:
        'One to ten direct image URLs or file_path values returned by Generate Asset Upload URLs.',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Edit Prompt',
      description: 'Describe the changes to make to the source images.',
      required: true,
    }),
    image_count: Property.StaticDropdown({
      displayName: 'Image Count',
      description: 'Number of edited images to generate.',
      required: true,
      defaultValue: 1,
      options: {
        options: [
          { label: '1', value: 1 },
          { label: '4', value: 4 },
          { label: '9', value: 9 },
          { label: '16', value: 16 },
        ],
      },
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
          { label: 'Flux 2 Klein', value: 'flux-2-klein' },
          { label: 'Nano Banana 2 Lite', value: 'nano-banana-2-lite' },
          { label: 'Qwen Edit', value: 'qwen-edit' },
          { label: 'Krea 2', value: 'krea-2' },
          { label: 'Seedream v4', value: 'seedream-v4' },
          { label: 'Seedream v4.5', value: 'seedream-v4.5' },
          { label: 'Seedream v5 Pro', value: 'seedream-v5-pro' },
          { label: 'Nano Banana', value: 'nano-banana' },
          { label: 'Nano Banana Pro', value: 'nano-banana-pro' },
        ],
      },
    }),
    aspect_ratio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      description: 'Output shape. Automatic preserves a model-selected shape.',
      required: true,
      defaultValue: 'auto',
      options: {
        options: [
          { label: 'Automatic', value: 'auto' },
          { label: '16:9', value: '16:9' },
          { label: '9:16', value: '9:16' },
          { label: '4:3', value: '4:3' },
          { label: '3:2', value: '3:2' },
          { label: '1:1', value: '1:1' },
          { label: '4:5', value: '4:5' },
          { label: '2:3', value: '2:3' },
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
      path: '/ai-image-editor',
      body: {
        image_count: context.propsValue.image_count,
        model: context.propsValue.model,
        aspect_ratio: context.propsValue.aspect_ratio,
        resolution: context.propsValue.resolution,
        style: { prompt: context.propsValue.prompt },
        assets: { image_file_paths: context.propsValue.image_file_paths },
        ...(context.propsValue.name
          ? { name: context.propsValue.name }
          : {}),
      },
    });
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { photoroomAuth } from '../auth';
import { photoroomClient } from '../common/client';
import { photoroomProps } from '../common/props';
import { generateImageOutputSchema } from '../output-schemas';

export const generateImage = createAction({
  name: 'generate_image',
  classification: 'READ',
  displayName: 'Generate Image',
  description: 'Generate a new image from a text prompt with Photoroom AI',
  audience: 'both',
  aiMetadata: {
    description:
      'Generates a brand new image from a text prompt with the Photoroom Image Editing API and writes it to a file; no input image is needed. Use this to create an image from scratch; to modify an existing photo use edit_image instead. Reuse the returned seed to get a similar-looking result for the same prompt. Not idempotent: each call produces a new file and consumes Photoroom account credits.',
    idempotent: false,
  },
  outputSchema: generateImageOutputSchema,
  auth: photoroomAuth,
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe the image to generate.',
      required: true,
    }),
    filename: photoroomProps.outputFilename(),
    seed: Property.Number({
      displayName: 'Seed',
      description:
        'Seed for the image generation; reuse a seed from a previous call to get a similar-looking result for the same prompt.',
      required: false,
    }),
    size: Property.StaticDropdown({
      displayName: 'Image Size',
      description: 'Aspect ratio and resolution of the generated image.',
      required: false,
      options: {
        options: [
          { label: 'Square HD', value: 'SQUARE_HD' },
          { label: 'Landscape 16:9', value: 'LANDSCAPE_16_9' },
          { label: 'Landscape 4:3', value: 'LANDSCAPE_4_3' },
          { label: 'Portrait 16:9', value: 'PORTRAIT_16_9' },
          { label: 'Portrait 4:3', value: 'PORTRAIT_4_3' },
        ],
      },
    }),
    exportFormat: photoroomProps.exportFormat(),
  },
  async run({ auth, propsValue, files }) {
    const form = photoroomClient.buildGenerateImageFormData({
      prompt: propsValue.prompt,
      seed: propsValue.seed,
      size: propsValue.size,
      exportFormat: propsValue.exportFormat,
    });
    const result = await photoroomClient.sendEditRequest({
      apiKey: auth.props.apiKey,
      form,
    });
    const url = await files.write({
      fileName: propsValue.filename,
      data: result.data,
    });
    return {
      fileName: propsValue.filename,
      url,
      aiBackgroundSeed: result.aiBackgroundSeed,
    };
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { photoroomAuth } from '../auth';
import { photoroomClient } from '../common/client';
import { photoroomProps } from '../common/props';
import { editImageOutputSchema } from '../output-schemas';

export const editImage = createAction({
  name: 'edit_image',
  classification: 'READ',
  displayName: 'Edit Image',
  description:
    'Edit an image with Photoroom AI: background removal or generation, shadows, relighting, text removal, upscaling, expand and more in one call',
  audience: 'both',
  aiMetadata: {
    description:
      'Edits an input image with the Photoroom Image Editing API in a single call: optional background removal, an AI-generated or solid-color or custom-image background, AI shadows, relighting, text removal, upscaling, expand/uncrop, beautify, positioning and export options. Pick this for any photo edit beyond a plain cutout; for a bare background removal prefer removeBackground, and to create an image from only a text prompt use generate_image. Not idempotent: each call produces a new file and consumes Photoroom account credits (an edit call costs more credits than a remove-background call).',
    idempotent: false,
  },
  outputSchema: editImageOutputSchema,
  auth: photoroomAuth,
  props: {
    image: Property.File({ displayName: 'Image File', required: true }),
    filename: photoroomProps.outputFilename(),
    removeBackground: Property.Checkbox({
      displayName: 'Remove Background',
      description:
        'Remove the original background before applying the other edits. The API enables this by default.',
      required: false,
      defaultValue: true,
    }),
    backgroundPrompt: Property.LongText({
      displayName: 'Background Prompt',
      description:
        'Describe the AI background to generate, for example "on a marble table next to a window". Cannot be combined with Background Image.',
      required: false,
    }),
    backgroundColor: Property.ShortText({
      displayName: 'Background Color',
      description:
        'Solid background color. Hex code without the hash sign (for example FF0000) or HTML color name (for example red).',
      required: false,
    }),
    backgroundImage: Property.File({
      displayName: 'Background Image',
      description:
        'Image to place behind the subject. Cannot be combined with Background Prompt.',
      required: false,
    }),
    backgroundSeed: Property.Number({
      displayName: 'Background Seed',
      description:
        'Seed for the AI background generation; reuse a seed from a previous call to get a similar-looking background for the same prompt.',
      required: false,
    }),
    shadowMode: Property.StaticDropdown({
      displayName: 'Shadow',
      description: 'Generate an AI shadow under the subject.',
      required: false,
      options: {
        options: [
          { label: 'Soft', value: 'ai.soft' },
          { label: 'Hard', value: 'ai.hard' },
          { label: 'Floating', value: 'ai.floating' },
          { label: 'Preset Soft', value: 'ai.preset-soft' },
          { label: 'Preset Hard', value: 'ai.preset-hard' },
          { label: 'Auto', value: 'ai.auto-with-overrides' },
        ],
      },
    }),
    lightingMode: Property.StaticDropdown({
      displayName: 'Relight',
      description: 'Adjust the lighting of the image with AI.',
      required: false,
      options: {
        options: [
          { label: 'Auto', value: 'ai.auto' },
          {
            label: 'Preserve Hue and Saturation',
            value: 'ai.preserve-hue-and-saturation',
          },
          { label: 'Optimize for Portrait', value: 'ai.optimize-portrait' },
        ],
      },
    }),
    textRemovalMode: Property.StaticDropdown({
      displayName: 'Text Removal',
      description: 'Remove text found in the image with AI.',
      required: false,
      options: {
        options: [
          {
            label: 'Artificial Text (watermarks, overlays)',
            value: 'ai.artificial',
          },
          { label: 'Natural Text (signs, labels)', value: 'ai.natural' },
          { label: 'All Text', value: 'ai.all' },
        ],
      },
    }),
    upscaleMode: Property.StaticDropdown({
      displayName: 'Upscale',
      description:
        'Upscale the image up to 4 times its original size. Fast is optimized for speed, Slow for quality.',
      required: false,
      options: {
        options: [
          { label: 'Fast', value: 'ai.fast' },
          { label: 'Slow (higher quality)', value: 'ai.slow' },
        ],
      },
    }),
    expandMode: Property.StaticDropdown({
      displayName: 'Expand',
      description:
        'Fill transparent areas created by the output size based on the background content.',
      required: false,
      options: {
        options: [{ label: 'Auto', value: 'ai.auto' }],
      },
    }),
    uncropMode: Property.StaticDropdown({
      displayName: 'Uncrop',
      description: 'Reconstruct cropped parts of the subject with AI.',
      required: false,
      options: {
        options: [{ label: 'Auto', value: 'ai.auto' }],
      },
    }),
    beautifyMode: Property.StaticDropdown({
      displayName: 'Beautify',
      description:
        'Enhance the aesthetics of a product, food or car image. Works best with Remove Background enabled.',
      required: false,
      options: {
        options: [
          { label: 'Auto', value: 'ai.auto' },
          { label: 'Food', value: 'ai.food' },
          { label: 'Car', value: 'ai.car' },
        ],
      },
    }),
    padding: Property.ShortText({
      displayName: 'Padding',
      description:
        'Padding around the subject, as a ratio (0 to 0.49), percentage (for example 30%) or pixel value (for example 100px). Ignored on cropped sides of the subject.',
      required: false,
    }),
    margin: Property.ShortText({
      displayName: 'Margin',
      description:
        'Margin around the subject, as a ratio (0 to 0.49), percentage (for example 30%) or pixel value (for example 100px).',
      required: false,
    }),
    outputSize: Property.ShortText({
      displayName: 'Output Size',
      description:
        'Size of the result: auto, originalImage, croppedSubject, or a custom size like 1600x1600.',
      required: false,
    }),
    exportFormat: photoroomProps.exportFormat(),
    exportDpi: Property.Number({
      displayName: 'Export DPI',
      description:
        'Pixel density of the result image, between 72 and 1200 dpi.',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    const form = photoroomClient.buildEditImageFormData({
      image: propsValue.image,
      removeBackground: propsValue.removeBackground,
      backgroundPrompt: propsValue.backgroundPrompt,
      backgroundColor: propsValue.backgroundColor,
      backgroundImage: propsValue.backgroundImage,
      backgroundSeed: propsValue.backgroundSeed,
      shadowMode: propsValue.shadowMode,
      lightingMode: propsValue.lightingMode,
      textRemovalMode: propsValue.textRemovalMode,
      upscaleMode: propsValue.upscaleMode,
      expandMode: propsValue.expandMode,
      uncropMode: propsValue.uncropMode,
      beautifyMode: propsValue.beautifyMode,
      padding: propsValue.padding,
      margin: propsValue.margin,
      outputSize: propsValue.outputSize,
      exportFormat: propsValue.exportFormat,
      exportDpi: propsValue.exportDpi,
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
      uncertaintyScore: result.uncertaintyScore,
      aiBackgroundSeed: result.aiBackgroundSeed,
    };
  },
});

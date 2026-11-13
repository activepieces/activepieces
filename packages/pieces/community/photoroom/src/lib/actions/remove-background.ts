import { createAction, Property } from '@activepieces/pieces-framework';
import { photoroomAuth } from '../auth';
import { photoroomClient } from '../common/client';
import { photoroomProps } from '../common/props';
import { removeBackgroundOutputSchema } from '../output-schemas';

export const removeBackground = createAction({
  name: 'removeBackground',
  classification: 'READ',
  displayName: 'Remove background',
  description: 'Remove the background of the image given as input',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes the background from an input image using the Photoroom segmentation API and writes the cutout to a file. Choose this to isolate a subject or produce a transparent-background version of a photo; for AI backgrounds, shadows or other edits use edit_image instead. Requires the raw image as a file input plus a filename for the generated output. Not idempotent: each call performs a fresh server-side segmentation that produces a new file and consumes Photoroom account credits.',
    idempotent: false,
  },
  outputSchema: removeBackgroundOutputSchema,
  auth: photoroomAuth,
  props: {
    file: Property.File({ displayName: 'Image file', required: true }),
    filename: photoroomProps.outputFilename(),
    format: Property.StaticDropdown({
      displayName: 'Output Format',
      description: 'Format of the result image. Defaults to PNG.',
      required: false,
      options: {
        options: [
          { label: 'PNG', value: 'png' },
          { label: 'JPG', value: 'jpg' },
          { label: 'WebP', value: 'webp' },
        ],
      },
    }),
    channels: Property.StaticDropdown({
      displayName: 'Channels',
      description:
        'Return the full color image (RGBA) or only the alpha mask of the cutout.',
      required: false,
      options: {
        options: [
          { label: 'RGBA', value: 'rgba' },
          { label: 'Alpha mask', value: 'alpha' },
        ],
      },
    }),
    bgColor: Property.ShortText({
      displayName: 'Background Color',
      description:
        'Fill the background with this color instead of keeping it transparent. Hex code (for example FF0000) or HTML color name (for example red).',
      required: false,
    }),
    size: Property.StaticDropdown({
      displayName: 'Output Size',
      description: 'Maximum size of the result image. Defaults to full.',
      required: false,
      options: {
        options: [
          { label: 'Preview (0.25 megapixels)', value: 'preview' },
          { label: 'Medium (1.5 megapixels)', value: 'medium' },
          { label: 'HD (4 megapixels)', value: 'hd' },
          { label: 'Full (36 megapixels)', value: 'full' },
        ],
      },
    }),
    crop: Property.Checkbox({
      displayName: 'Crop to Subject',
      description: 'Crop the result to the bounding box of the subject.',
      required: false,
    }),
    despill: Property.Checkbox({
      displayName: 'Despill',
      description:
        'Remove colored reflections left on the subject by a green screen background.',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    const form = photoroomClient.buildRemoveBackgroundFormData({
      file: propsValue.file,
      format: propsValue.format,
      channels: propsValue.channels,
      bgColor: propsValue.bgColor,
      size: propsValue.size,
      crop: propsValue.crop,
      despill: propsValue.despill,
    });
    const result = await photoroomClient.sendRemoveBackgroundRequest({
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
    };
  },
});

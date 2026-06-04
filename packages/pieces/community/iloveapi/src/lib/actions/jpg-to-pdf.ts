import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { sharedProps } from '../common/props';
import { runAndStoreResult } from '../common/runner';
import { UploadInput } from '../common/client';

export const jpgToPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'jpg_to_pdf',
  displayName: 'JPG to PDF',
  description: 'Convert one or more images (JPG/PNG) into a PDF document.',
  props: {
    images: Property.Array({
      displayName: 'Images',
      description: 'Images to include in the PDF, in order.',
      required: true,
      properties: {
        file: Property.File({
          displayName: 'Image',
          required: true,
        }),
      },
    }),
    orientation: Property.StaticDropdown({
      displayName: 'Orientation',
      required: false,
      defaultValue: 'portrait',
      options: {
        disabled: false,
        options: [
          { label: 'Portrait', value: 'portrait' },
          { label: 'Landscape', value: 'landscape' },
        ],
      },
    }),
    margin: Property.Number({
      displayName: 'Margin (px)',
      description: 'Page margin in pixels around each image. Default 0.',
      required: false,
    }),
    pagesize: Property.StaticDropdown({
      displayName: 'Page Size',
      required: false,
      defaultValue: 'fit',
      options: {
        disabled: false,
        options: [
          { label: 'Fit to image', value: 'fit' },
          { label: 'A4', value: 'A4' },
          { label: 'Letter', value: 'letter' },
        ],
      },
    }),
    merge_after: Property.Checkbox({
      displayName: 'Merge into single PDF',
      description:
        'When enabled (default), produces one PDF for all images. When disabled, produces one PDF per image.',
      required: false,
      defaultValue: true,
    }),
    ...sharedProps,
  },
  async run(context) {
    const {
      images,
      orientation,
      margin,
      pagesize,
      merge_after,
      output_filename,
      packaged_filename,
    } = context.propsValue;

    if (!Array.isArray(images) || images.length === 0) {
      throw new Error('At least one image is required.');
    }

    const uploads: UploadInput[] = images.map((entry) => {
      const file = (entry as { file: { base64: string; filename: string } }).file;
      if (!file?.base64) {
        throw new Error('Each row must include an image file.');
      }
      return {
        kind: 'file',
        file: { base64: file.base64, filename: file.filename },
      };
    });

    const options: Record<string, unknown> = {
      orientation: orientation ?? 'portrait',
      pagesize: pagesize ?? 'fit',
      merge_after: merge_after ?? true,
    };
    if (margin !== undefined && margin !== null) {
      options['margin'] = margin;
    }

    return await runAndStoreResult({
      auth: context.auth.secret_text,
      files: context.files,
      tool: 'imagepdf',
      uploads,
      options,
      output_filename,
      packaged_filename,
    });
  },
});

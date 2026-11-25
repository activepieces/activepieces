import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iloveSchemas } from '../common/schemas';
import { regionOf, rowFiles, sharedProps, webhookOf } from '../common/props';
import { runAndStoreResult } from '../common/runner';

export const jpgToPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'jpg_to_pdf',
  classification: 'READ',
  displayName: 'JPG to PDF',
  description: 'Convert one or more images (JPG/PNG) into a PDF document.',
  audience: 'both',
  outputSchema: iloveSchemas.toolResult,
  aiMetadata: {
    description:
      'Convert one or more JPG/PNG images into PDF, with control over orientation, page size, and margin. By default all images are merged into a single PDF; disable "Merge into single PDF" to instead get one PDF per image. Each run produces new output rather than reusing a prior result.',
    idempotent: false,
  },
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

    const uploads = rowFiles({ rows: images, label: 'Images' });
    if (margin !== undefined && margin !== null && (!Number.isFinite(margin) || margin < 0)) {
      throw new Error('Margin must be a number of pixels, 0 or more.');
    }

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
      region: regionOf(context.propsValue.region),
      webhook: webhookOf(context.propsValue.webhook_url),
      files: context.files,
      tool: 'imagepdf',
      uploads,
      options,
      output_filename,
      packaged_filename,
    });
  },
});

import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, sharedProps } from '../common/props';
import { runAndStoreResult } from '../common/runner';
import { UploadInput } from '../common/client';

export const watermarkPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'watermark_pdf',
  displayName: 'Watermark PDF',
  description: 'Stamp a text or image watermark across pages of a PDF.',
  props: {
    file: Property.File({
      displayName: 'PDF File',
      required: true,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Watermark Mode',
      required: true,
      defaultValue: 'text',
      options: {
        disabled: false,
        options: [
          { label: 'Text', value: 'text' },
          { label: 'Image', value: 'image' },
        ],
      },
    }),
    text: Property.ShortText({
      displayName: 'Text',
      description: 'Required when mode is "Text". The watermark text to stamp.',
      required: false,
    }),
    image: Property.File({
      displayName: 'Watermark Image',
      description:
        'Required when mode is "Image". JPG/PNG image used as the watermark.',
      required: false,
    }),
    pages: Property.ShortText({
      displayName: 'Pages',
      description:
        'Pages to apply watermark to. Use "all", a single page, or ranges like "1-3,5".',
      required: false,
      defaultValue: 'all',
    }),
    vertical_position: Property.StaticDropdown({
      displayName: 'Vertical Position',
      required: false,
      defaultValue: 'middle',
      options: {
        disabled: false,
        options: [
          { label: 'Top', value: 'top' },
          { label: 'Middle', value: 'middle' },
          { label: 'Bottom', value: 'bottom' },
        ],
      },
    }),
    horizontal_position: Property.StaticDropdown({
      displayName: 'Horizontal Position',
      required: false,
      defaultValue: 'center',
      options: {
        disabled: false,
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
        ],
      },
    }),
    rotation: Property.Number({
      displayName: 'Rotation (degrees)',
      description: 'Rotation between 0 and 360 degrees.',
      required: false,
      defaultValue: 0,
    }),
    transparency: Property.Number({
      displayName: 'Transparency (%)',
      description: '0 = solid, 100 = fully transparent.',
      required: false,
      defaultValue: 0,
    }),
    mosaic: Property.Checkbox({
      displayName: 'Mosaic',
      description: 'Repeat the watermark across the entire page.',
      required: false,
      defaultValue: false,
    }),
    layer: Property.StaticDropdown({
      displayName: 'Layer',
      description: 'Place the watermark above or below the page content.',
      required: false,
      defaultValue: 'above',
      options: {
        disabled: false,
        options: [
          { label: 'Above content', value: 'above' },
          { label: 'Below content', value: 'below' },
        ],
      },
    }),
    font_family: Property.StaticDropdown({
      displayName: 'Font (text mode)',
      required: false,
      defaultValue: 'Arial',
      options: {
        disabled: false,
        options: [
          { label: 'Arial', value: 'Arial' },
          { label: 'Arial Unicode MS', value: 'Arial Unicode MS' },
          { label: 'Verdana', value: 'Verdana' },
          { label: 'Courier', value: 'Courier' },
          { label: 'Times New Roman', value: 'Times New Roman' },
          { label: 'Comic Sans MS', value: 'Comic Sans MS' },
          { label: 'WenQuanYi Zen Hei', value: 'WenQuanYi Zen Hei' },
          { label: 'Lohit Marathi', value: 'Lohit Marathi' },
        ],
      },
    }),
    font_size: Property.Number({
      displayName: 'Font Size (text mode)',
      required: false,
      defaultValue: 14,
    }),
    font_color: Property.ShortText({
      displayName: 'Font Color (text mode)',
      description: 'Hex color, e.g. #000000.',
      required: false,
      defaultValue: '#000000',
    }),
    font_style: Property.StaticDropdown({
      displayName: 'Font Style (text mode)',
      required: false,
      defaultValue: '',
      options: {
        disabled: false,
        options: [
          { label: 'Regular', value: '' },
          { label: 'Bold', value: 'Bold' },
          { label: 'Italic', value: 'Italic' },
        ],
      },
    }),
    ...sharedProps,
  },
  async run(context) {
    const {
      file,
      mode,
      text,
      image,
      pages,
      vertical_position,
      horizontal_position,
      rotation,
      transparency,
      mosaic,
      layer,
      font_family,
      font_size,
      font_color,
      font_style,
      output_filename,
      packaged_filename,
    } = context.propsValue;

    if (mode === 'text' && !text) {
      throw new Error('"Text" is required when watermark mode is "Text".');
    }
    if (mode === 'image' && !image?.base64) {
      throw new Error(
        'A watermark image is required when watermark mode is "Image".'
      );
    }

    const baseOptions: Record<string, unknown> = {
      mode,
      pages: pages ?? 'all',
      vertical_position: vertical_position ?? 'middle',
      horizontal_position: horizontal_position ?? 'center',
      rotation: rotation ?? 0,
      transparency: transparency ?? 0,
      mosaic: mosaic ?? false,
      layer: layer ?? 'above',
    };

    if (mode === 'text') {
      baseOptions['text'] = text;
      baseOptions['font_family'] = font_family ?? 'Arial';
      baseOptions['font_size'] = font_size ?? 14;
      baseOptions['font_color'] = font_color ?? '#000000';
      if (font_style) baseOptions['font_style'] = font_style;
    }

    const extraUploads: UploadInput[] | undefined =
      mode === 'image' && image?.base64
        ? [
            {
              kind: 'file',
              file: { base64: image.base64, filename: image.filename },
            },
          ]
        : undefined;

    return await runAndStoreResult({
      auth: context.auth.secret_text,
      files: context.files,
      tool: 'watermark',
      uploads: [fileToUploadInput(file)],
      extraUploads,
      options: (extras) => {
        if (mode === 'image') {
          return { ...baseOptions, image: extras[0] };
        }
        return baseOptions;
      },
      output_filename,
      packaged_filename,
    });
  },
});

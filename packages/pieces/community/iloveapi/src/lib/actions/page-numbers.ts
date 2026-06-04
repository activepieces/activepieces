import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, sharedProps } from '../common/props';
import { runAndStoreResult } from '../common/runner';

export const pageNumbersPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'page_numbers_pdf',
  displayName: 'Add Page Numbers to PDF',
  description: 'Stamp page numbers onto a PDF, with control over position and styling.',
  props: {
    file: Property.File({
      displayName: 'PDF File',
      required: true,
    }),
    pages: Property.ShortText({
      displayName: 'Pages',
      description:
        'Pages to number. Use "all" or ranges like "2-5,7". Defaults to all.',
      required: false,
      defaultValue: 'all',
    }),
    starting_number: Property.Number({
      displayName: 'Starting Number',
      description: 'First page number to print. Defaults to 1.',
      required: false,
      defaultValue: 1,
    }),
    first_cover: Property.Checkbox({
      displayName: 'Skip First Page (Cover)',
      description: 'When enabled, skips numbering the first page.',
      required: false,
      defaultValue: false,
    }),
    facing_pages: Property.Checkbox({
      displayName: 'Facing Pages (book mode)',
      description:
        'Alternate horizontal position for left/right pages, like a printed book.',
      required: false,
      defaultValue: false,
    }),
    vertical_position: Property.StaticDropdown({
      displayName: 'Vertical Position',
      required: false,
      defaultValue: 'bottom',
      options: {
        disabled: false,
        options: [
          { label: 'Top', value: 'top' },
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
    text: Property.ShortText({
      displayName: 'Number Format',
      description: 'Use {n} for current page and {p} for total pages. Example: "{n} of {p}".',
      required: false,
      defaultValue: '{n}',
    }),
    font_family: Property.StaticDropdown({
      displayName: 'Font',
      required: false,
      defaultValue: 'Arial',
      options: {
        disabled: false,
        options: [
          { label: 'Arial', value: 'Arial' },
          { label: 'Verdana', value: 'Verdana' },
          { label: 'Courier', value: 'Courier' },
          { label: 'Times New Roman', value: 'Times New Roman' },
          { label: 'Comic Sans MS', value: 'Comic Sans MS' },
        ],
      },
    }),
    font_size: Property.Number({
      displayName: 'Font Size',
      required: false,
      defaultValue: 14,
    }),
    font_color: Property.ShortText({
      displayName: 'Font Color',
      description: 'Hex color, e.g. #000000.',
      required: false,
      defaultValue: '#000000',
    }),
    ...sharedProps,
  },
  async run(context) {
    const {
      file,
      pages,
      starting_number,
      first_cover,
      facing_pages,
      vertical_position,
      horizontal_position,
      text,
      font_family,
      font_size,
      font_color,
      output_filename,
      packaged_filename,
    } = context.propsValue;

    const options: Record<string, unknown> = {
      pages: pages ?? 'all',
      starting_number: starting_number ?? 1,
      first_cover: first_cover ?? false,
      facing_pages: facing_pages ?? false,
      vertical_position: vertical_position ?? 'bottom',
      horizontal_position: horizontal_position ?? 'center',
      text: text ?? '{n}',
      font_family: font_family ?? 'Arial',
      font_size: font_size ?? 14,
      font_color: font_color ?? '#000000',
    };

    return await runAndStoreResult({
      auth:context.auth.secret_text,
      files: context.files,
      tool: 'pagenumber',
      uploads: [fileToUploadInput(file)],
      options,
      output_filename,
      packaged_filename,
    });
  },
});

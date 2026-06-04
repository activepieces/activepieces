import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { fileToUploadInput, sharedProps } from '../common/props';
import { runAndStoreResult } from '../common/runner';

export const splitPdfAction = createAction({
  auth: iloveapiAuth,
  name: 'split_pdf',
  displayName: 'Split PDF',
  description:
    'Split a PDF by page ranges, fixed page batches, removed pages, or target file size.',
  props: {
    file: Property.File({
      displayName: 'PDF File',
      required: true,
    }),
    split_mode: Property.StaticDropdown({
      displayName: 'Split Mode',
      required: true,
      defaultValue: 'ranges',
      options: {
        disabled: false,
        options: [
          { label: 'Page Ranges', value: 'ranges' },
          { label: 'Fixed Range (every N pages)', value: 'fixed_range' },
          { label: 'Remove Pages', value: 'remove_pages' },
          { label: 'By File Size', value: 'filesize' },
        ],
      },
    }),
    ranges: Property.ShortText({
      displayName: 'Ranges',
      description:
        'Used with mode "Page Ranges". Example: "1-5,7,10-13". Each range becomes a separate PDF.',
      required: false,
    }),
    fixed_range: Property.Number({
      displayName: 'Fixed Range Size',
      description:
        'Used with mode "Fixed Range". Number of pages per output PDF (e.g. 1 splits into one PDF per page).',
      required: false,
    }),
    remove_pages: Property.ShortText({
      displayName: 'Remove Pages',
      description:
        'Used with mode "Remove Pages". Pages to delete, e.g. "2,4-6". The remaining pages stay in one PDF.',
      required: false,
    }),
    filesize: Property.Number({
      displayName: 'File Size (MB)',
      description:
        'Used with mode "By File Size". Maximum size in megabytes per output PDF.',
      required: false,
    }),
    merge_after: Property.Checkbox({
      displayName: 'Merge results back into one PDF',
      description: 'When enabled, merges the split outputs into a single PDF.',
      required: false,
      defaultValue: false,
    }),
    ...sharedProps,
  },
  async run(context) {
    const {
      file,
      split_mode,
      ranges,
      fixed_range,
      remove_pages,
      filesize,
      merge_after,
      output_filename,
      packaged_filename,
    } = context.propsValue;

    const options: Record<string, unknown> = {
      split_mode,
      merge_after: merge_after ?? false,
    };

    if (split_mode === 'ranges') {
      if (!ranges) {
        throw new Error('"Ranges" is required when split mode is "Page Ranges".');
      }
      options['ranges'] = ranges;
    } else if (split_mode === 'fixed_range') {
      if (fixed_range === undefined || fixed_range === null) {
        throw new Error(
          '"Fixed Range Size" is required when split mode is "Fixed Range".'
        );
      }
      options['fixed_range'] = fixed_range;
    } else if (split_mode === 'remove_pages') {
      if (!remove_pages) {
        throw new Error(
          '"Remove Pages" is required when split mode is "Remove Pages".'
        );
      }
      options['remove_pages'] = remove_pages;
    } else if (split_mode === 'filesize') {
      if (filesize === undefined || filesize === null) {
        throw new Error(
          '"File Size (MB)" is required when split mode is "By File Size".'
        );
      }
      options['filesize'] = filesize;
    }

    return await runAndStoreResult({
      auth: context.auth.secret_text,
      files: context.files,
      tool: 'split',
      uploads: [fileToUploadInput(file)],
      options,
      output_filename,
      packaged_filename,
    });
  },
});

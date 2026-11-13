import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { convertApiAuth } from '../auth';
import { convertApi } from '../common/client';
import { splitPdfOutputSchema } from '../output-schemas';

export const splitPdfAction = createAction({
    auth: convertApiAuth,
    name: 'split_pdf',
    classification: 'WRITE',
    displayName: 'Split PDF File',
    description: 'Split a PDF into several PDFs by page count, page ranges, single pages, matching text or bookmarks.',
    audience: 'both',
    aiMetadata: {
        description:
            'Splits one PDF into multiple new PDFs with ConvertAPI and returns a list with one stored file per part. Pick the mode that matches the request: fixed page counts, explicit page ranges, individual pages, a regular expression that starts each new part, or the document bookmarks. Use Merge PDF Files for the opposite. Each call uses ConvertAPI conversions and creates new output files.',
        idempotent: false,
    },
    props: {
        file: Property.File({
            displayName: 'PDF File',
            description: 'The PDF to split.',
            required: true,
        }),
        mode: Property.StaticDropdown({
            displayName: 'Split By',
            description: 'How the PDF is cut into parts.',
            required: true,
            defaultValue: 'pagecount',
            options: {
                options: [
                    { label: 'Page count (every N pages)', value: 'pagecount' },
                    { label: 'Page ranges', value: 'ranges' },
                    { label: 'Single pages', value: 'singlepages' },
                    { label: 'Text match (regular expression)', value: 'text' },
                    { label: 'Bookmarks', value: 'bookmark' },
                ],
            },
        }),
        valueHelp: Property.MarkDown({
            variant: MarkdownVariant.INFO,
            value: `**Split Value** by mode:
- **Page count**: pages per part, e.g. \`5\`, or a repeating pattern such as \`3,2\`. Leave empty for one file per page.
- **Page ranges**: one part per range, e.g. \`1-3,5,7-9\` gives three files.
- **Single pages**: each listed page becomes its own file, e.g. \`1-2,5\` gives pages 1, 2 and 5.
- **Text match**: a regular expression; a new part starts at every page whose text matches, e.g. \`Invoice\\s+#\\d+\`.
- **Bookmarks**: leave empty.`,
        }),
        value: Property.ShortText({
            displayName: 'Split Value',
            description: 'What to split on. The format depends on the Split By mode.',
            placeholder: 'e.g. 1-3,5,7-9',
            required: false,
        }),
        mergeOutput: Property.Checkbox({
            displayName: 'Merge Parts Into One PDF',
            description: 'Join the parts back into one PDF, e.g. to extract selected pages.',
            required: false,
            defaultValue: false,
        }),
        password: Property.ShortText({
            displayName: 'Password',
            description: 'Only needed if the PDF is password-protected.',
            required: false,
        }),
        fileName: Property.ShortText({
            displayName: 'Output File Name',
            description: 'Base name for the parts, without extension. Each part gets a number.',
            placeholder: 'e.g. invoice',
            required: false,
        }),
    },
    outputSchema: splitPdfOutputSchema,
    async run({ auth, propsValue, files }) {
        const mode = propsValue.mode ?? 'pagecount';
        const value = propsValue.value?.trim() ?? '';
        if (MODES_REQUIRING_VALUE.includes(mode) && value.length === 0) {
            throw new Error(`Enter a Split Value for the "${mode}" mode.`);
        }

        const result = await convertApi.convertFiles({
            apiKey: auth.secret_text,
            from: 'pdf',
            to: 'split',
            fileInputs: [{ name: 'File', files: [propsValue.file], multiple: false }],
            parameters: convertApi.toValueParameters({
                Mode: mode,
                Value: mode === 'bookmark' ? undefined : value,
                MergeOutput: propsValue.mergeOutput === true ? true : undefined,
                Password: propsValue.password,
                FileName: propsValue.fileName,
            }),
            files,
        });

        return result.files;
    },
});

const MODES_REQUIRING_VALUE = ['ranges', 'singlepages', 'text'];

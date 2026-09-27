import { createAction, Property } from '@activepieces/pieces-framework';
import { convertApiAuth } from '../auth';
import { convertApi } from '../common/client';
import { inputFiles } from '../common/input-files';
import { mergePdfOutputSchema } from '../output-schemas';

export const mergePdfAction = createAction({
    auth: convertApiAuth,
    name: 'merge_pdf',
    classification: 'WRITE',
    displayName: 'Merge PDF Files',
    description: 'Combine several PDF files into one PDF, in the order you list them.',
    audience: 'both',
    aiMetadata: {
        description:
            'Merges two or more PDF files into a single new PDF with ConvertAPI, keeping the listed order, and returns it as a stored file. Use Split PDF File to break a PDF apart, or Convert File to merge Word or PowerPoint documents. Each call uses ConvertAPI conversions and creates a new output file.',
        idempotent: false,
    },
    props: {
        files: Property.Array({
            displayName: 'PDF Files',
            description: 'Add the PDF files in the order they should appear in the merged document. At least two are needed.',
            required: true,
            properties: {
                file: Property.File({
                    displayName: 'PDF File',
                    required: true,
                }),
            },
        }),
        fileName: Property.ShortText({
            displayName: 'Output File Name',
            description: 'Name for the merged file, without the extension. Leave empty to let ConvertAPI name it.',
            required: false,
        }),
        password: Property.ShortText({
            displayName: 'Password',
            description: 'Only needed if the PDFs are password-protected. The same password is used to open every file.',
            required: false,
        }),
        bookmarksTableOfContents: Property.StaticDropdown({
            displayName: 'Bookmark Each File',
            description: 'Add a top-level bookmark for each merged file, named after the file name or the PDF title.',
            required: false,
            defaultValue: 'disabled',
            options: {
                options: [
                    { label: 'No bookmarks', value: 'disabled' },
                    { label: 'Use file names', value: 'filename' },
                    { label: 'Use PDF titles', value: 'title' },
                ],
            },
        }),
        pageSize: Property.StaticDropdown({
            displayName: 'Page Size',
            description: 'Scale every page to this size. Keep "Original" to leave pages as they are.',
            required: false,
            defaultValue: 'default',
            options: {
                options: [
                    { label: 'Original', value: 'default' },
                    { label: 'A2', value: 'a2' },
                    { label: 'A3', value: 'a3' },
                    { label: 'A4', value: 'a4' },
                    { label: 'A5', value: 'a5' },
                    { label: 'A6', value: 'a6' },
                    { label: 'Letter', value: 'letter' },
                    { label: 'Legal', value: 'legal' },
                ],
            },
        }),
        pageOrientation: Property.StaticDropdown({
            displayName: 'Page Orientation',
            description: 'Rotate every page to this orientation. Keep "Original" to leave pages as they are.',
            required: false,
            defaultValue: 'default',
            options: {
                options: [
                    { label: 'Original', value: 'default' },
                    { label: 'Portrait', value: 'portrait' },
                    { label: 'Landscape', value: 'landscape' },
                ],
            },
        }),
    },
    outputSchema: mergePdfOutputSchema,
    async run({ auth, propsValue, files }) {
        const pdfFiles = inputFiles.fromArrayItems({ items: propsValue.files, key: 'file' });
        if (pdfFiles.length < 2) {
            throw new Error('Add at least two PDF files to merge.');
        }

        const result = await convertApi.convertFiles({
            apiKey: auth.secret_text,
            from: 'pdf',
            to: 'merge',
            fileInputs: [{ name: 'Files', files: pdfFiles, multiple: true }],
            parameters: convertApi.toValueParameters({
                FileName: propsValue.fileName,
                Password: propsValue.password,
                BookmarksTableOfContents: propsValue.bookmarksTableOfContents,
                PageSize: propsValue.pageSize,
                PageOrientation: propsValue.pageOrientation,
            }),
            files,
        });

        return {
            ...result.files[0],
            conversion_cost: result.conversion_cost,
        };
    },
});

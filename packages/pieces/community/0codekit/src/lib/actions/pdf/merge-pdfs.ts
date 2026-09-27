import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitFiles } from '../../common/files';
import { zeroCodeKitPdf } from '../../common/pdf';
import { filesStorageOutputSchemas } from '../../common/output-schemas/files-storage';

export const mergePdfsAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'merge_pdfs',
    classification: 'WRITE',
    displayName: 'Merges multiple PDFs',
    description: 'Combine several PDF files into one, in the order you list them.',
    audience: 'both',
    aiMetadata: {
        description:
            'Combine two or more PDFs into a single PDF file, in list order. Each entry takes a PDF file or public URL and optional page ranges such as "1-3,5" (^1 means the last page). Creates a new file on every call.',
        idempotent: false,
    },
    props: {
        pdfs: Property.Array({
            displayName: 'PDFs',
            description: 'The PDFs to combine, in the order they should appear.',
            required: true,
            properties: {
                file: Property.File({
                    displayName: 'PDF',
                    description: 'A PDF file from an earlier step or a public URL.',
                    required: true,
                }),
                pages: Property.ShortText({
                    displayName: 'Pages',
                    description: 'Pages to include, for example `1-3,5`. `^1` is the last page. Leave empty to include all pages.',
                    required: false,
                }),
            },
        }),
        fileName: zeroCodeKitPdf.fileName({ description: 'Name of the merged PDF file. Defaults to `merged.pdf`.' }),
    },
    outputSchema: filesStorageOutputSchemas.mergedPdf,
    async run({ auth, propsValue, files }) {
        const entries = (propsValue.pdfs ?? []).map((item, index) => toMergeEntry({ item, index }));
        if (entries.length < 2) {
            throw new Error('Add at least two PDFs to merge.');
        }
        const data = await zeroCodeKitFiles.postForBinary({
            apiKey: auth.secret_text,
            path: '/pdf/merge',
            body: {
                files: entries,
                getAsUrl: false,
            },
        });
        return {
            ...(await zeroCodeKitFiles.save({
                files,
                fileName: zeroCodeKitFiles.withExtension({
                    name: zeroCodeKitPdf.baseName({ name: propsValue.fileName, fallback: 'merged' }),
                    extension: 'pdf',
                }),
                data,
            })),
            merged_count: entries.length,
        };
    },
});

function toMergeEntry({ item, index }: { item: unknown; index: number }): MergeEntry {
    const file = isRecord(item) ? item['file'] : undefined;
    if (!zeroCodeKitPdf.isApFile(file)) {
        throw new Error(`PDF #${index + 1} is missing a file.`);
    }
    const pages = isRecord(item) && typeof item['pages'] === 'string' ? zeroCodeKitPdf.clean(item['pages']) : undefined;
    return pages === undefined
        ? { buffer: zeroCodeKitFiles.toBase64(file) }
        : { buffer: zeroCodeKitFiles.toBase64(file), pages };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

type MergeEntry = {
    buffer: string;
    pages?: string;
};

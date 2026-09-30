import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi, ZEROCODEKIT_TIMEOUT_MS } from '../../common/client';
import { zeroCodeKitFiles } from '../../common/files';
import { zeroCodeKitPdf } from '../../common/pdf';
import { filesStorageOutputSchemas } from '../../common/output-schemas/files-storage';

export const splitPdfAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'split_pdf',
    classification: 'WRITE',
    displayName: 'Splits a PDF',
    description: 'Break a PDF into several smaller PDF files.',
    audience: 'both',
    aiMetadata: {
        description:
            'Split one PDF into several PDF files, either every N pages or by explicit page ranges (one range per output file, such as "1-3" or "4,6"; ^1 means the last page). Returns a list of files, one per part. Creates new files on every call.',
        idempotent: false,
    },
    props: {
        pdf: zeroCodeKitPdf.pdfFile({
            displayName: 'PDF',
            description: 'The PDF file to split, from an earlier step or a public URL.',
        }),
        mode: Property.StaticDropdown({
            displayName: 'Split By',
            description: 'How to divide the PDF.',
            required: true,
            defaultValue: 'interval',
            options: {
                options: [
                    { label: 'Every N pages', value: 'interval' },
                    { label: 'Page ranges', value: 'pages' },
                ],
            },
        }),
        interval: Property.Number({
            displayName: 'Pages per File',
            description: 'Used with **Every N pages**. For example `1` gives one file per page.',
            required: false,
            defaultValue: 1,
        }),
        pageRanges: Property.Array({
            displayName: 'Page Ranges',
            description: 'One entry per output file (Page ranges mode). `^1` is the last page.',
            required: false,
            placeholder: '1-3',
        }),
        fileName: zeroCodeKitPdf.fileName({
            description: 'Name prefix for the new files. Parts are named `<prefix>-1.pdf`, `<prefix>-2.pdf`, and so on. Defaults to `part`.',
        }),
    },
    outputSchema: filesStorageOutputSchemas.splitPdf,
    async run({ auth, propsValue, files }) {
        const deadline = Date.now() + SPLIT_BUDGET_MS;
        const response = await zeroCodeKitApi.post<SplitResponse>({
            apiKey: auth.secret_text,
            path: '/pdf/split',
            body: {
                buffer: zeroCodeKitFiles.toBase64(propsValue.pdf),
                ...splitRule({ mode: propsValue.mode, interval: propsValue.interval, pageRanges: propsValue.pageRanges }),
            },
        });
        const urls = response.pdfUrls ?? [];
        const prefix = zeroCodeKitPdf.baseName({ name: propsValue.fileName, fallback: 'part' });
        const saved = [];
        for (const url of urls) {
            zeroCodeKitFiles.assertZeroCodeKitUrl(url);
        }
        for (const [index, url] of urls.entries()) {
            const remaining = deadline - Date.now();
            if (remaining <= 0) {
                throw new Error(
                    `Downloading the ${urls.length} split parts took too long; ${saved.length} were saved. Split into fewer, larger parts.`,
                );
            }
            const data = await zeroCodeKitPdf.download({ url, timeoutMs: Math.min(remaining, ZEROCODEKIT_TIMEOUT_MS.file) });
            saved.push(await zeroCodeKitFiles.save({ files, fileName: `${prefix}-${index + 1}.pdf`, data }));
        }
        return saved;
    },
});

function splitRule({
    mode,
    interval,
    pageRanges,
}: {
    mode: string;
    interval: number | undefined;
    pageRanges: unknown[] | undefined;
}): Record<string, unknown> {
    if (mode === 'pages') {
        const pages = (pageRanges ?? [])
            .map((range) => (typeof range === 'string' || typeof range === 'number' ? String(range).trim() : ''))
            .filter((range) => range !== '');
        if (pages.length === 0) {
            throw new Error('Add at least one page range, for example 1-3.');
        }
        return { pages };
    }
    if (interval === undefined || interval === null || !Number.isInteger(interval) || interval < 1) {
        throw new Error('Pages per File must be a whole number of 1 or more.');
    }
    return { interval };
}

const SPLIT_BUDGET_MS = 480_000;

type SplitResponse = {
    pdfUrls?: string[];
};

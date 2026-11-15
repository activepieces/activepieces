import { ApFile, OutputSchema } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { decodeQrCodeAction } from '../src/lib/actions/image/decode-qr-code';
import { generateQrCodeAction } from '../src/lib/actions/image/generate-qr-code';
import { imageExifAction } from '../src/lib/actions/image/image-exif';
import { createPdfFromHtmlAction } from '../src/lib/actions/pdf/create-pdf-from-html';
import { createPdfFromUrlAction } from '../src/lib/actions/pdf/create-pdf-from-url';
import { getPdfPageCountAction } from '../src/lib/actions/pdf/get-pdf-page-count';
import { mergePdfsAction } from '../src/lib/actions/pdf/merge-pdfs';
import { splitPdfAction } from '../src/lib/actions/pdf/split-pdf';
import { addAGlobalVariableAction } from '../src/lib/actions/storage/add-a-global-variable';
import { addAPermFileAction } from '../src/lib/actions/storage/add-a-perm-file';
import { deleteAGlobalVariableAction } from '../src/lib/actions/storage/delete-a-global-variable';
import { deleteAPermFileAction } from '../src/lib/actions/storage/delete-a-perm-file';
import { getAGlobalVariableAction } from '../src/lib/actions/storage/get-a-global-variable';
import { getAPermFileAction } from '../src/lib/actions/storage/get-a-perm-file';
import { listGlobalVariablesAction } from '../src/lib/actions/storage/list-global-variables';
import { listPermFilesAction } from '../src/lib/actions/storage/list-perm-files';
import { addTemporaryFileAction } from '../src/lib/actions/temp-file/add-temporary-file';
import { runAction, TestAction } from './helpers';

const sendRequest = vi.fn();
const write = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
    return {
        ...actual,
        httpClient: {
            sendRequest: (...args: unknown[]) => sendRequest(...args),
        },
    };
});

const PDF = new ApFile('in.pdf', Buffer.from('%PDF-in'), 'pdf');
const IMAGE = new ApFile('photo.jpg', Buffer.from('jpeg-bytes'), 'jpg');
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

function respond(body: unknown) {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
}

function binary(data: Buffer | string) {
    const buffer = typeof data === 'string' ? Buffer.from(data) : data;
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

function paths(fields: OutputSchema['fields']): string[] {
    return fields.map((field) => field.value ?? field.key).sort();
}

function keysOf(value: unknown): string[] {
    return isRecord(value) ? Object.keys(value).sort() : [];
}

function fieldAt({ schema, path }: { schema: OutputSchema | undefined; path: string }) {
    return (schema?.fields ?? []).find((field) => (field.value ?? field.key) === path);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

beforeEach(() => {
    sendRequest.mockReset();
    write.mockReset();
    write.mockImplementation(async ({ fileName }: { fileName: string }) => `file://${fileName}`);
});

describe('files and storage output schemas', () => {
    const objectCases: [string, SchemaAction, () => void, Record<string, unknown>][] = [
        ['Get PDF page count', getPdfPageCountAction, () => respond({ pageCount: 3 }), { pdf: PDF }],
        ['Create PDF from HTML', createPdfFromHtmlAction, () => respond(binary('%PDF-html')), { html: '<p>hi</p>' }],
        ['Create PDF from URL', createPdfFromUrlAction, () => respond(binary('%PDF-url')), { url: 'https://example.com' }],
        [
            'Merge PDFs',
            mergePdfsAction,
            () => respond(binary('%PDF-merged')),
            { pdfs: [{ file: PDF }, { file: PDF }] },
        ],
        ['Generate QR code', generateQrCodeAction, () => respond(binary(PNG)), { data: 'https://example.com' }],
        ['Decode QR code', decodeQrCodeAction, () => respond({ data: 'hello' }), { file: IMAGE }],
        [
            'Image EXIF',
            imageExifAction,
            () => respond({ exifData: { image: { Make: 'Canon' }, gps: {} } }),
            { file: IMAGE },
        ],
        [
            'Add temporary file',
            addTemporaryFileAction,
            () => respond({ url: 'https://tmp.example/a.pdf', fileName: 'a.pdf' }),
            { file: PDF },
        ],
        [
            'Add global variable',
            addAGlobalVariableAction,
            () => respond({ variableName: 'k', variableValue: 'v' }),
            { variableName: 'k', variableValue: 'v' },
        ],
        [
            'Get global variable',
            getAGlobalVariableAction,
            () => respond({ variableName: 'k', variableValue: 'v' }),
            { variableName: 'k' },
        ],
        [
            'List global variables',
            listGlobalVariablesAction,
            () => respond({ variables: [{ variableName: 'k', variableValue: 'v' }] }),
            {},
        ],
        ['Delete global variable', deleteAGlobalVariableAction, () => respond({ message: 'ok' }), { variableName: 'k' }],
        [
            'Add perm file',
            addAPermFileAction,
            () => respond({ fileId: 'f1', url: 'https://prod.0codekit.com/a.pdf' }),
            { fileUrl: 'https://example.com/a.pdf', uploadName: 'a.pdf' },
        ],
        [
            'Get perm file',
            getAPermFileAction,
            () => {
                respond({ url: 'https://prod.0codekit.com/a.pdf' });
                respond(binary('%PDF-perm'));
            },
            { fileId: 'f1' },
        ],
        ['Delete perm file', deleteAPermFileAction, () => respond({ message: 'ok' }), { fileId: 'f1' }],
        [
            'List perm files',
            listPermFilesAction,
            () =>
                respond({
                    availableStorage: 1024,
                    files: [{ fileId: 'f1', fileName: 'a.pdf', url: 'https://prod.0codekit.com/a.pdf', size: 12 }],
                }),
            {},
        ],
    ];

    it.each(objectCases)('%s schema matches the run() output keys', async (_name, action, mock, propsValue) => {
        mock();
        const output = await runAction({ action, propsValue, write });
        expect(action.outputSchema).toBeDefined();
        expect(paths(action.outputSchema?.fields ?? [])).toEqual(keysOf(output));
    });

    it('Get perm file with Link Only returns a subset of the schema keys', async () => {
        respond({ url: 'https://prod.0codekit.com/a.pdf' });
        const output = await runAction({ action: getAPermFileAction, propsValue: { fileId: 'f1', linkOnly: true }, write });
        const schemaPaths = paths(getAPermFileAction.outputSchema?.fields ?? []);
        expect(keysOf(output).every((key) => schemaPaths.includes(key))).toBe(true);
    });

    it('List global variables item fields match each variable', async () => {
        respond({ variables: [{ variableName: 'k', variableValue: 'v' }] });
        const output = await runAction({ action: listGlobalVariablesAction, propsValue: {}, write });
        const field = fieldAt({ schema: listGlobalVariablesAction.outputSchema, path: 'variables' });
        const first = isRecord(output) && Array.isArray(output['variables']) ? output['variables'][0] : undefined;
        expect(paths(field?.listItems ?? [])).toEqual(keysOf(first));
    });

    it('List perm files item fields match each file', async () => {
        respond({ availableStorage: 1, files: [{ fileId: 'f1', fileName: 'a.pdf', url: 'https://x', size: 1 }] });
        const output = await runAction({ action: listPermFilesAction, propsValue: {}, write });
        const field = fieldAt({ schema: listPermFilesAction.outputSchema, path: 'files' });
        const first = isRecord(output) && Array.isArray(output['files']) ? output['files'][0] : undefined;
        expect(paths(field?.listItems ?? [])).toEqual(keysOf(first));
    });

    it('Split PDF wraps the top-level array and its item fields match each part', async () => {
        respond({ pdfUrls: ['https://prod.0codekit.com/a.pdf'] });
        respond(binary('%PDF-a'));
        const output = await runAction({ action: splitPdfAction, propsValue: { pdf: PDF, mode: 'interval', interval: 1 }, write });
        const schema = splitPdfAction.outputSchema;
        expect(Array.isArray(output)).toBe(true);
        expect(schema?.itemLabel).toBeDefined();
        expect(schema?.fields).toHaveLength(1);
        const wrapper = schema?.fields[0];
        expect(wrapper?.value).toBe('');
        const first = Array.isArray(output) ? output[0] : undefined;
        expect(paths(wrapper?.listItems ?? [])).toEqual(keysOf(first));
    });
});

type SchemaAction = TestAction & {
    outputSchema?: OutputSchema;
};

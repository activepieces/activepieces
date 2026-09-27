import { HttpError } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { convertFileAction } from '../src/lib/actions/convert-file';
import { mergePdfAction } from '../src/lib/actions/merge-pdf';
import { splitPdfAction } from '../src/lib/actions/split-pdf';
import { convertApiAuth } from '../src/lib/auth';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
    return {
        ...actual,
        httpClient: {
            sendRequest: (...args: unknown[]) => sendRequest(...args),
        },
    };
});

const AUTH = { type: 'SECRET_TEXT', secret_text: 'token_123' };
const BASE = 'https://v2.convertapi.com';

type Request = {
    method: string;
    url: string;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
    body?: unknown;
    responseType?: string;
    retries?: number;
};

type ConversionReply = { status?: number; body: unknown };

function pdf(name: string) {
    return { filename: name, data: Buffer.from(`%PDF ${name}`) };
}

function resultFile(name: string, id: string) {
    return {
        FileName: name,
        FileExt: name.split('.').pop(),
        FileSize: 1000,
        FileId: id,
        Url: `${BASE}/d/${id}/${name}`,
    };
}

function mockApi({ conversion, info }: { conversion?: ConversionReply; info?: unknown } = {}) {
    let uploads = 0;
    sendRequest.mockImplementation(async (request: Request) => {
        if (request.url === `${BASE}/upload`) {
            uploads += 1;
            return { status: 200, body: { FileId: `up${uploads}`, FileName: request.queryParams?.['filename'] } };
        }
        if (request.url.startsWith(`${BASE}/convert/`)) {
            const reply = conversion ?? { body: { ConversionCost: 1, Files: [resultFile('out.pdf', 'res1')] } };
            if (reply.status !== undefined && reply.status >= 400) {
                throw new HttpError(request.body, { status: reply.status, responseBody: reply.body });
            }
            return { status: 200, body: reply.body };
        }
        if (request.url.startsWith(`${BASE}/info`)) {
            return { status: 200, body: info ?? [] };
        }
        if (request.method === 'GET' && request.url.startsWith(`${BASE}/d/`)) {
            return { status: 200, body: Buffer.from(`bytes of ${request.url}`) };
        }
        if (request.method === 'DELETE') {
            return { status: 200, body: undefined };
        }
        throw new Error(`Unexpected request ${request.method} ${request.url}`);
    });
}

function requests(): Request[] {
    return sendRequest.mock.calls.map((call) => call[0]);
}

function conversionRequest(): Request {
    const found = requests().find((request) => request.url.startsWith(`${BASE}/convert/`));
    if (found === undefined) {
        throw new Error('no conversion request');
    }
    return found;
}

function parametersOf(request: Request): Record<string, unknown>[] {
    const body = request.body;
    if (typeof body !== 'object' || body === null || !('Parameters' in body) || !Array.isArray(body.Parameters)) {
        throw new Error('no Parameters');
    }
    return body.Parameters;
}

function param(request: Request, name: string) {
    return parametersOf(request).find((parameter) => parameter['Name'] === name);
}

function makeFiles() {
    return { write: vi.fn(async ({ fileName }: { fileName: string }) => `https://ap.files/${fileName}`) };
}

function runMerge(propsValue: Record<string, unknown>, files = makeFiles()) {
    return mergePdfAction.run({ auth: AUTH, propsValue, files } as never);
}

function runSplit(propsValue: Record<string, unknown>, files = makeFiles()) {
    return splitPdfAction.run({ auth: AUTH, propsValue, files } as never);
}

function runConvert(propsValue: Record<string, unknown>, files = makeFiles()) {
    return convertFileAction.run({ auth: AUTH, propsValue, files } as never);
}

const DOCX_TO_PDF = {
    Name: 'Word',
    Title: 'DOCX to PDF API',
    SourceFileFormats: ['docx'],
    SourceExtensions: ['doc', 'docx'],
    DestinationFileFormats: ['pdf'],
    DestinationExtensions: ['pdf'],
    ConverterParameterGroups: [
        {
            Name: 'Authentication',
            ConverterParameters: [{ Name: 'Token', Type: 'String', Required: false, Array: false }],
        },
        {
            Name: 'Input',
            ConverterParameters: [
                { Name: 'File', Type: 'File', Required: true, Array: false },
                { Name: 'PageRange', Label: 'Page range', Type: 'String', Required: false, Array: false, Default: '1-2000' },
            ],
        },
        {
            Name: 'Output',
            ConverterParameters: [
                { Name: 'FileName', Label: 'Output file name', Type: 'String', Required: false, Array: false },
                { Name: 'StoreFile', Type: 'Bool', Required: false, Array: false, Default: false },
            ],
        },
        {
            Name: 'Execution',
            ConverterParameters: [{ Name: 'Timeout', Type: 'Integer', Required: false, Array: false, Default: 900 }],
        },
        {
            Name: 'PDF',
            ConverterParameters: [
                { Name: 'PdfVersion', Label: 'PDF version', Type: 'Collection', Required: false, Array: false, Default: '1.7', Values: { '1.4': 'PDF 1.4', '1.7': 'PDF 1.7' } },
                { Name: 'ConvertMarkups', Label: 'Convert markups', Type: 'Bool', Required: false, Array: false, Default: false },
                { Name: 'ImageQuality', Label: 'Image quality', Type: 'Integer', Required: false, Array: false, Default: 75 },
                { Name: 'Scale', Label: 'Scale', Type: 'Double', Required: false, Array: false },
                { Name: 'TemplateFile', Label: 'Template', Type: 'File', Required: false, Array: false },
            ],
        },
    ],
};

const DOCX_MERGE = {
    Name: 'Word',
    Title: 'Merge DOCX API',
    SourceFileFormats: ['docx'],
    SourceExtensions: ['docx'],
    DestinationFileFormats: ['merge'],
    ConverterParameterGroups: [
        { Name: 'Input', ConverterParameters: [{ Name: 'Files', Type: 'File', Required: true, Array: true }] },
    ],
};

const PDF_TO_JPG = {
    Name: 'Pdf',
    Title: 'PDF to JPG API',
    SourceFileFormats: ['pdf'],
    SourceExtensions: ['pdf'],
    DestinationFileFormats: ['jpg'],
    ConverterParameterGroups: [
        { Name: 'Input', ConverterParameters: [{ Name: 'File', Type: 'File', Required: true, Array: false }] },
    ],
};

const DATA_TO_QR = {
    Name: 'Barcode',
    Title: 'Data to QR Code API',
    SourceFileFormats: ['data'],
    DestinationFileFormats: ['qrcode'],
    ConverterParameterGroups: [
        { Name: 'Input', ConverterParameters: [{ Name: 'Data', Type: 'String', Required: true, Array: false }] },
    ],
};

beforeEach(() => {
    sendRequest.mockReset();
});

describe('Merge PDF Files', () => {
    it('uploads every file as raw bytes, then converts by file id', async () => {
        mockApi();

        await runMerge({ files: [{ file: pdf('a.pdf') }, { file: pdf('b.pdf') }] });

        const uploads = requests().filter((request) => request.url === `${BASE}/upload`);
        expect(uploads).toHaveLength(2);
        expect(uploads[0].method).toBe('POST');
        expect(uploads[0].headers?.['Content-Type']).toBe('application/octet-stream');
        expect(uploads[0].headers?.['Authorization']).toBe('Bearer token_123');
        expect(uploads[0].queryParams).toEqual({ filename: 'a.pdf' });
        expect(Buffer.isBuffer(uploads[0].body)).toBe(true);

        const conversion = conversionRequest();
        expect(conversion.url).toBe(`${BASE}/convert/pdf/to/merge`);
        expect(conversion.headers?.['Authorization']).toBe('Bearer token_123');
        expect(param(conversion, 'Files')).toEqual({ Name: 'Files', FileValues: [{ Id: 'up1' }, { Id: 'up2' }] });
    });

    it('always asks for stored files and a timeout under the step limit', async () => {
        mockApi();

        await runMerge({ files: [{ file: pdf('a.pdf') }, { file: pdf('b.pdf') }] });

        const conversion = conversionRequest();
        expect(param(conversion, 'StoreFile')).toEqual({ Name: 'StoreFile', Value: 'true' });
        expect(param(conversion, 'Timeout')).toEqual({ Name: 'Timeout', Value: '540' });
        expect(Number(param(conversion, 'Timeout')?.['Value'])).toBeLessThanOrEqual(540);
    });

    it('sends the merge options as string values and skips empty ones', async () => {
        mockApi();

        await runMerge({
            files: [{ file: pdf('a.pdf') }, { file: pdf('b.pdf') }],
            fileName: 'combined',
            password: 'secret',
            bookmarksTableOfContents: 'filename',
            pageSize: 'a4',
            pageOrientation: 'landscape',
        });

        const conversion = conversionRequest();
        expect(param(conversion, 'FileName')).toEqual({ Name: 'FileName', Value: 'combined' });
        expect(param(conversion, 'Password')).toEqual({ Name: 'Password', Value: 'secret' });
        expect(param(conversion, 'BookmarksTableOfContents')).toEqual({ Name: 'BookmarksTableOfContents', Value: 'filename' });
        expect(param(conversion, 'PageSize')).toEqual({ Name: 'PageSize', Value: 'a4' });
        expect(param(conversion, 'PageOrientation')).toEqual({ Name: 'PageOrientation', Value: 'landscape' });

        sendRequest.mockClear();
        await runMerge({ files: [{ file: pdf('a.pdf') }, { file: pdf('b.pdf') }], fileName: '' });
        expect(param(conversionRequest(), 'FileName')).toBeUndefined();
        expect(param(conversionRequest(), 'Password')).toBeUndefined();
    });

    it('downloads the result URL and writes it as an Activepieces file', async () => {
        mockApi({ conversion: { body: { ConversionCost: 2, Files: [resultFile('merged.pdf', 'res1')] } } });
        const files = makeFiles();

        const result = await runMerge({ files: [{ file: pdf('a.pdf') }, { file: pdf('b.pdf') }] }, files);

        const download = requests().find((request) => request.method === 'GET' && request.url.includes('/d/res1'));
        expect(download?.url).toBe(`${BASE}/d/res1/merged.pdf`);
        expect(download?.responseType).toBe('arraybuffer');
        expect(download?.headers).toBeUndefined();
        expect(files.write).toHaveBeenCalledTimes(1);
        expect(files.write.mock.calls[0][0].fileName).toBe('merged.pdf');
        expect(Buffer.isBuffer(files.write.mock.calls[0][0].data)).toBe(true);
        expect(result).toEqual({
            file: 'https://ap.files/merged.pdf',
            file_name: 'merged.pdf',
            file_extension: 'pdf',
            file_size: 1000,
            conversion_cost: 2,
        });
        expect(JSON.stringify(result)).not.toContain('FileData');
    });

    it('accepts the FileUrl field some responses use instead of Url', async () => {
        mockApi({
            conversion: { body: { Files: [{ FileName: 'merged.pdf', FileExt: 'pdf', FileUrl: `${BASE}/d/alt/merged.pdf` }] } },
        });

        const result = await runMerge({ files: [{ file: pdf('a.pdf') }, { file: pdf('b.pdf') }] });

        expect(result.file).toBe('https://ap.files/merged.pdf');
        expect(result.conversion_cost).toBeNull();
    });

    it('fails clearly when ConvertAPI returns no download link instead of passing base64 through', async () => {
        mockApi({ conversion: { body: { Files: [{ FileName: 'merged.pdf', FileData: 'JVBERi0x' }] } } });

        await expect(runMerge({ files: [{ file: pdf('a.pdf') }, { file: pdf('b.pdf') }] })).rejects.toThrow(
            /did not return a download link/,
        );
    });

    it('deletes the uploaded inputs and the stored result from ConvertAPI afterwards', async () => {
        mockApi();

        await runMerge({ files: [{ file: pdf('a.pdf') }, { file: pdf('b.pdf') }] });

        const deleted = requests()
            .filter((request) => request.method === 'DELETE')
            .map((request) => request.url);
        expect(deleted.sort()).toEqual([`${BASE}/d/res1`, `${BASE}/d/up1`, `${BASE}/d/up2`]);
    });

    it('needs at least two files before calling ConvertAPI', async () => {
        await expect(runMerge({ files: [{ file: pdf('a.pdf') }] })).rejects.toThrow(/at least two/);
        expect(sendRequest).not.toHaveBeenCalled();
    });
});

describe('Split PDF File', () => {
    it.each([
        { mode: 'pagecount', value: '5', expected: '5' },
        { mode: 'pagecount', value: '3,2', expected: '3,2' },
        { mode: 'ranges', value: '1-3,5,7-9', expected: '1-3,5,7-9' },
        { mode: 'singlepages', value: '1-2,5', expected: '1-2,5' },
        { mode: 'text', value: 'Invoice\\s+#\\d+', expected: 'Invoice\\s+#\\d+' },
    ])('sends Mode=$mode with Value=$value', async ({ mode, value, expected }) => {
        mockApi();

        await runSplit({ file: pdf('doc.pdf'), mode, value });

        const conversion = conversionRequest();
        expect(conversion.url).toBe(`${BASE}/convert/pdf/to/split`);
        expect(param(conversion, 'File')).toEqual({ Name: 'File', FileValue: { Id: 'up1' } });
        expect(param(conversion, 'Mode')).toEqual({ Name: 'Mode', Value: mode });
        expect(param(conversion, 'Value')).toEqual({ Name: 'Value', Value: expected });
    });

    it('omits Value for page count when empty, giving one file per page', async () => {
        mockApi();

        await runSplit({ file: pdf('doc.pdf'), mode: 'pagecount', value: '' });

        expect(param(conversionRequest(), 'Mode')).toEqual({ Name: 'Mode', Value: 'pagecount' });
        expect(param(conversionRequest(), 'Value')).toBeUndefined();
    });

    it('ignores Value for the bookmark mode', async () => {
        mockApi();

        await runSplit({ file: pdf('doc.pdf'), mode: 'bookmark', value: 'anything' });

        expect(param(conversionRequest(), 'Mode')).toEqual({ Name: 'Mode', Value: 'bookmark' });
        expect(param(conversionRequest(), 'Value')).toBeUndefined();
    });

    it.each(['ranges', 'singlepages', 'text'])('requires a Value for the %s mode', async (mode) => {
        await expect(runSplit({ file: pdf('doc.pdf'), mode, value: '  ' })).rejects.toThrow(/Split Value/);
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('sends MergeOutput and Password only when set', async () => {
        mockApi();

        await runSplit({ file: pdf('doc.pdf'), mode: 'ranges', value: '1,3', mergeOutput: true, password: 'pw' });
        expect(param(conversionRequest(), 'MergeOutput')).toEqual({ Name: 'MergeOutput', Value: 'true' });
        expect(param(conversionRequest(), 'Password')).toEqual({ Name: 'Password', Value: 'pw' });

        sendRequest.mockClear();
        await runSplit({ file: pdf('doc.pdf'), mode: 'ranges', value: '1,3', mergeOutput: false });
        expect(param(conversionRequest(), 'MergeOutput')).toBeUndefined();
        expect(param(conversionRequest(), 'Password')).toBeUndefined();
    });

    it('returns one stored file per part, as an array', async () => {
        mockApi({
            conversion: {
                body: {
                    ConversionCost: 1,
                    Files: [resultFile('doc_0.pdf', 'r0'), resultFile('doc_1.pdf', 'r1'), resultFile('doc_2.pdf', 'r2')],
                },
            },
        });
        const files = makeFiles();

        const result = await runSplit({ file: pdf('doc.pdf'), mode: 'pagecount', value: '1' }, files);

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(3);
        expect(files.write).toHaveBeenCalledTimes(3);
        expect(result.map((part) => part.file)).toEqual([
            'https://ap.files/doc_0.pdf',
            'https://ap.files/doc_1.pdf',
            'https://ap.files/doc_2.pdf',
        ]);
        expect(Object.keys(result[0]).sort()).toEqual(['file', 'file_extension', 'file_name', 'file_size']);
    });
});

describe('error surfacing', () => {
    it('shows ConvertAPI\'s message for a concurrency limit and does not retry', async () => {
        mockApi({
            conversion: { status: 503, body: { Code: 5030, Message: 'Too many parallel conversions.' } },
        });

        const error = await runSplit({ file: pdf('doc.pdf'), mode: 'pagecount' }).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(Error);
        const message = error instanceof Error ? error.message : '';
        expect(message).toContain('Too many parallel conversions.');
        expect(message).toContain('code 5030');
        expect(message).toContain('HTTP 503');
        expect(message).toMatch(/one/);
        const conversions = requests().filter((request) => request.url.startsWith(`${BASE}/convert/`));
        expect(conversions).toHaveLength(1);
        expect(conversions[0].retries).toBeUndefined();
    });

    it('still cleans up uploaded files when the conversion fails', async () => {
        mockApi({ conversion: { status: 500, body: { Code: 5002, Message: 'The file is damaged.' } } });

        await expect(runSplit({ file: pdf('doc.pdf'), mode: 'pagecount' })).rejects.toThrow(/The file is damaged/);

        expect(requests().some((request) => request.method === 'DELETE' && request.url === `${BASE}/d/up1`)).toBe(true);
    });

    it('reads error bodies that arrive as JSON strings', async () => {
        mockApi({ conversion: { status: 401, body: '{"Code":4011,"Message":"Unauthorized."}' } });

        await expect(runSplit({ file: pdf('doc.pdf'), mode: 'pagecount' })).rejects.toThrow(
            /Unauthorized\., code 4011\. Check that your API token is active/,
        );
    });
});

describe('Convert File', () => {
    it('looks up the converter, uploads the file and converts it', async () => {
        mockApi({ info: [DOCX_TO_PDF] });

        const result = await runConvert({ from: 'docx', to: 'pdf', file: pdf('letter.docx'), options: {} });

        expect(requests()[0].url).toBe(`${BASE}/info/docx/to/pdf`);
        const conversion = conversionRequest();
        expect(conversion.url).toBe(`${BASE}/convert/docx/to/pdf`);
        expect(param(conversion, 'File')).toEqual({ Name: 'File', FileValue: { Id: 'up1' } });
        expect(result).toEqual([
            { file: 'https://ap.files/out.pdf', file_name: 'out.pdf', file_extension: 'pdf', file_size: 1000 },
        ]);
    });

    it('passes the converter options but never lets them override StoreFile or Timeout', async () => {
        mockApi({ info: [DOCX_TO_PDF] });

        await runConvert({
            from: 'docx',
            to: 'pdf',
            file: pdf('letter.docx'),
            options: { PageRange: '1-3', ConvertMarkups: true, ImageQuality: 80, Timeout: 900, StoreFile: false, Empty: '' },
        });

        const conversion = conversionRequest();
        expect(param(conversion, 'PageRange')).toEqual({ Name: 'PageRange', Value: '1-3' });
        expect(param(conversion, 'ConvertMarkups')).toEqual({ Name: 'ConvertMarkups', Value: 'true' });
        expect(param(conversion, 'ImageQuality')).toEqual({ Name: 'ImageQuality', Value: '80' });
        expect(param(conversion, 'Empty')).toBeUndefined();
        const timeouts = parametersOf(conversion).filter((parameter) => parameter['Name'] === 'Timeout');
        expect(timeouts).toEqual([{ Name: 'Timeout', Value: '540' }]);
        const storeFiles = parametersOf(conversion).filter((parameter) => parameter['Name'] === 'StoreFile');
        expect(storeFiles).toEqual([{ Name: 'StoreFile', Value: 'true' }]);
    });

    it('names the output "converted" when the input came from a URL with no file name', async () => {
        mockApi({ info: [DOCX_TO_PDF] });

        await runConvert({ from: 'docx', to: 'pdf', file: pdf('unknown.docx'), options: {} });

        expect(param(conversionRequest(), 'FileName')).toEqual({ Name: 'FileName', Value: 'converted' });
    });

    it('keeps the input name, or the FileName option, when there is one', async () => {
        mockApi({ info: [DOCX_TO_PDF, DOCX_TO_PDF] });

        await runConvert({ from: 'docx', to: 'pdf', file: pdf('letter.docx'), options: {} });
        expect(param(conversionRequest(), 'FileName')).toBeUndefined();

        await runConvert({ from: 'docx', to: 'pdf', file: pdf('unknown.docx'), options: { FileName: 'invoice' } });
        const conversions = requests().filter((request) => request.url.includes('/convert/'));
        expect(param(conversions[conversions.length - 1], 'FileName')).toEqual({ Name: 'FileName', Value: 'invoice' });
    });

    it('sends every file as Files for converters that combine files', async () => {
        mockApi({ info: [DOCX_MERGE] });

        await runConvert({
            from: 'docx',
            to: 'merge',
            file: pdf('one.docx'),
            additionalFiles: [{ file: pdf('two.docx') }, { file: pdf('three.docx') }],
        });

        expect(param(conversionRequest(), 'Files')).toEqual({
            Name: 'Files',
            FileValues: [{ Id: 'up1' }, { Id: 'up2' }, { Id: 'up3' }],
        });
    });

    it('rejects additional files for single-file converters before uploading', async () => {
        mockApi({ info: [DOCX_TO_PDF] });

        await expect(
            runConvert({ from: 'docx', to: 'pdf', file: pdf('a.docx'), additionalFiles: [{ file: pdf('b.docx') }] }),
        ).rejects.toThrow(/takes a single file/);
        expect(requests().some((request) => request.url === `${BASE}/upload`)).toBe(false);
    });

    it('returns every output file when a conversion produces several', async () => {
        mockApi({
            info: [PDF_TO_JPG],
            conversion: { body: { Files: [resultFile('p-1.jpg', 'j1'), resultFile('p-2.jpg', 'j2')] } },
        });

        const result = await runConvert({ from: 'pdf', to: 'jpg', file: pdf('deck.pdf') });

        expect(result.map((item) => item.file_name)).toEqual(['p-1.jpg', 'p-2.jpg']);
    });

    it('reports a missing converter', async () => {
        mockApi({ info: [] });

        await expect(runConvert({ from: 'docx', to: 'xyz', file: pdf('a.docx') })).rejects.toThrow(/no converter/);
    });
});

describe('/info dropdowns', () => {
    const fromProp = convertFileAction.props.from;
    const toProp = convertFileAction.props.to;
    const optionsProp = convertFileAction.props.options;

    it('lists each source format once with its extensions, skipping converters without a file input', async () => {
        mockApi({ info: [DOCX_TO_PDF, DOCX_MERGE, PDF_TO_JPG, DATA_TO_QR, { Name: 'broken' }] });

        const result = await fromProp.options({ auth: AUTH } as never, {} as never);

        expect(requests()[0].url).toBe(`${BASE}/info`);
        expect(result.options).toEqual([
            { label: 'DOCX (.docx, .doc)', value: 'docx' },
            { label: 'PDF', value: 'pdf' },
        ]);
    });

    it('asks for a From Format before listing targets', async () => {
        const result = await toProp.options({ auth: AUTH } as never, {} as never);

        expect(result.disabled).toBe(true);
        expect(result.placeholder).toMatch(/From Format/);
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('lists the targets for the chosen source using the converter titles', async () => {
        mockApi({ info: [DOCX_TO_PDF, DOCX_MERGE] });

        const result = await toProp.options({ auth: AUTH, from: 'docx' } as never, {} as never);

        expect(requests()[0].url).toBe(`${BASE}/info/docx/to/*`);
        expect(result.options).toEqual([
            { label: 'DOCX to PDF', value: 'pdf' },
            { label: 'Merge DOCX', value: 'merge' },
        ]);
    });

    it('builds option fields from the converter parameters', async () => {
        mockApi({ info: [DOCX_TO_PDF] });

        const props = await optionsProp.props({ auth: AUTH, from: 'docx', to: 'pdf' } as never, {} as never);

        expect(Object.keys(props).sort()).toEqual(['ConvertMarkups', 'FileName', 'ImageQuality', 'PageRange', 'PdfVersion', 'Scale']);
        expect(props['PageRange']).toMatchObject({ type: 'SHORT_TEXT', displayName: 'Page range', defaultValue: '1-2000' });
        expect(props['PdfVersion']).toMatchObject({
            type: 'STATIC_DROPDOWN',
            defaultValue: '1.7',
            options: { options: [{ label: 'PDF 1.4', value: '1.4' }, { label: 'PDF 1.7', value: '1.7' }] },
        });
        expect(props['ConvertMarkups']).toMatchObject({ type: 'CHECKBOX', defaultValue: false });
        expect(props['ImageQuality']).toMatchObject({ type: 'NUMBER', defaultValue: 75 });
        expect(props['Scale']).toMatchObject({ type: 'NUMBER' });
    });

    it('returns no option fields until both formats are picked', async () => {
        const props = await optionsProp.props({ auth: AUTH, from: 'docx' } as never, {} as never);

        expect(props).toEqual({});
        expect(sendRequest).not.toHaveBeenCalled();
    });
});

describe('auth validation', () => {
    const validate = convertApiAuth.validate;

    it('treats a 401 as an invalid token', async () => {
        sendRequest.mockRejectedValueOnce(new HttpError({}, { status: 401, responseBody: { Code: 4011, Message: 'Unauthorized.' } }));

        const result = await validate?.({ auth: 'bad' } as never);

        expect(result).toMatchObject({ valid: false });
        expect(sendRequest.mock.calls[0][0].headers.Authorization).toBe('Bearer bad');
    });

    it('treats a parameter validation error as a working token, without running a conversion', async () => {
        sendRequest.mockRejectedValueOnce(new HttpError({}, { status: 400, responseBody: { Code: 4000, Message: 'Parameter validation error.' } }));

        const result = await validate?.({ auth: 'good' } as never);

        expect(result).toEqual({ valid: true });
        expect(sendRequest.mock.calls[0][0].body).toEqual({ Parameters: [] });
    });

    it('reports network failures without calling the token invalid', async () => {
        sendRequest.mockRejectedValueOnce(new HttpError({}, { status: 502, responseBody: 'Bad gateway' }));

        const result = await validate?.({ auth: 'good' } as never);

        expect(result).toMatchObject({ valid: false, error: expect.stringMatching(/Could not reach ConvertAPI/) });
    });
});

describe('output schemas', () => {
    function fieldKeys(fields: { key: string }[] | undefined): string[] {
        return (fields ?? []).map((field) => field.key).sort();
    }

    it('describes the flat merged file with the same keys run() returns', async () => {
        mockApi({ conversion: { body: { ConversionCost: 2, Files: [resultFile('merged.pdf', 'res1')] } } });

        const result = await runMerge({ files: [{ file: pdf('a.pdf') }, { file: pdf('b.pdf') }] });

        const schema = mergePdfAction.outputSchema;
        expect(schema?.itemLabel).toBeUndefined();
        expect(fieldKeys(schema?.fields)).toEqual(Object.keys(result).sort());
    });

    it('describes each split part with the same keys run() returns', async () => {
        mockApi({ conversion: { body: { Files: [resultFile('p-1.pdf', 'r1'), resultFile('p-2.pdf', 'r2')] } } });

        const result = await runSplit({ file: pdf('doc.pdf'), mode: 'pagecount', value: '1' });

        const schema = splitPdfAction.outputSchema;
        expect(schema?.itemLabel).toBe('{file_name}');
        expect(schema?.fields).toHaveLength(1);
        expect(schema?.fields[0].value).toBe('');
        expect(fieldKeys(schema?.fields[0].listItems)).toEqual(Object.keys(result[0]).sort());
    });

    it('describes each converted file with the same keys run() returns', async () => {
        mockApi({ info: [DOCX_TO_PDF] });

        const result = await runConvert({ from: 'docx', to: 'pdf', file: pdf('letter.docx'), options: {} });

        const schema = convertFileAction.outputSchema;
        expect(schema?.itemLabel).toBe('{file_name}');
        expect(schema?.fields).toHaveLength(1);
        expect(schema?.fields[0].value).toBe('');
        expect(fieldKeys(schema?.fields[0].listItems)).toEqual(Object.keys(result[0]).sort());
    });
});

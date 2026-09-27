import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ApFile } from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { entityDetectionAction } from '../src/lib/actions/ai/entity-detection';
import { validateIbanAction } from '../src/lib/actions/business/validate-iban';
import { runJavascriptCodeAction } from '../src/lib/actions/code/run-javascript-code';
import { generateQrCodeAction } from '../src/lib/actions/image/generate-qr-code';
import { createPdfFromHtmlAction } from '../src/lib/actions/pdf/create-pdf-from-html';
import { getPdfPageCountAction } from '../src/lib/actions/pdf/get-pdf-page-count';
import { splitPdfAction } from '../src/lib/actions/pdf/split-pdf';
import { getAPermFileAction } from '../src/lib/actions/storage/get-a-perm-file';
import { addTemporaryFileAction } from '../src/lib/actions/temp-file/add-temporary-file';
import { zeroCodeKitApi, ZEROCODEKIT_TIMEOUT_MS } from '../src/lib/common/client';
import { zeroCodeKitFiles } from '../src/lib/common/files';
import { zeroCodeKitPdf } from '../src/lib/common/pdf';
import { zeroCodeKitStorage } from '../src/lib/common/storage';
import { runAction } from './helpers';

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

const PDF = new ApFile('in.pdf', Buffer.from('%PDF-in'), 'pdf');
const STEP_LIMIT_MS = 600_000;
const write = vi.fn();

function respond(body: unknown) {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
}

function binary(text: string) {
    const buffer = Buffer.from(text);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

function call(index: number) {
    return sendRequest.mock.calls[index][0];
}

beforeEach(() => {
    sendRequest.mockReset();
    write.mockReset();
    write.mockImplementation(async ({ fileName }: { fileName: string }) => `file://${fileName}`);
});

describe('request timeouts', () => {
    it('gives simple lookups a 30 second timeout', async () => {
        respond({ valid: true });
        await runAction({ action: validateIbanAction, propsValue: { iban: 'DE89370400440532013000' }, write });
        expect(call(0).timeout).toBe(30_000);
    });

    it('gives AI endpoints a 60 second timeout', async () => {
        respond({ entities: [] });
        await runAction({ action: entityDetectionAction, propsValue: { text: 'Berlin' }, write });
        expect(call(0).timeout).toBe(60_000);
    });

    it('gives JSON file endpoints a 120 second timeout', async () => {
        respond({ pageCount: 1 });
        await runAction({ action: getPdfPageCountAction, propsValue: { pdf: PDF }, write });
        expect(call(0).timeout).toBe(120_000);

        respond({ url: 'https://prod.0codekit.com/tmp/a.pdf', fileName: 'a.pdf' });
        await runAction({ action: addTemporaryFileAction, propsValue: { file: PDF }, write });
        expect(call(1).timeout).toBe(120_000);
    });

    it('gives binary file endpoints a 120 second timeout', async () => {
        respond(binary('%PDF-html'));
        await runAction({ action: createPdfFromHtmlAction, propsValue: { html: '<p>x</p>' }, write });
        expect(call(0).timeout).toBe(120_000);
    });

    it('keeps code runs under the step limit', async () => {
        respond({ ok: true });
        await runAction({ action: runJavascriptCodeAction, propsValue: { code: 'return 1' }, write });
        expect(call(0).timeout).toBeGreaterThan(180_000);
        expect(call(0).timeout).toBeLessThan(STEP_LIMIT_MS - 60_000);
    });

    it('bounds every timeout class below the step limit', () => {
        for (const value of Object.values(ZEROCODEKIT_TIMEOUT_MS)) {
            expect(value).toBeGreaterThan(0);
            expect(value).toBeLessThan(STEP_LIMIT_MS);
        }
        expect(zeroCodeKitApi.timeoutFor('/storage/perm/add')).toBe(120_000);
        expect(zeroCodeKitApi.timeoutFor('/generate/qrcode/decode')).toBe(120_000);
        expect(zeroCodeKitApi.timeoutFor('/storage/perm/list')).toBe(30_000);
    });

    it('reports a timeout in plain words', async () => {
        const abort = new Error('This operation was aborted');
        abort.name = 'AbortError';
        sendRequest.mockRejectedValueOnce(abort);
        await expect(runAction({ action: validateIbanAction, propsValue: { iban: 'DE89' }, write })).rejects.toThrow(
            /did not answer in time/,
        );
    });
});

describe('downloads of links returned by 0CodeKit', () => {
    it('downloads https links on 0CodeKit domains without following redirects', async () => {
        respond(binary('%PDF-a'));
        await zeroCodeKitFiles.download({ url: 'https://prod.0codekit.com/files/a.pdf', failure: 'failed' });
        expect(call(0)).toMatchObject({
            method: 'GET',
            url: 'https://prod.0codekit.com/files/a.pdf',
            followRedirects: false,
            timeout: 120_000,
            responseType: 'arraybuffer',
        });
        expect(call(0).headers).toBeUndefined();
    });

    it.each([
        'https://v2.1saas.co/files/a.pdf',
        'https://storage.0codekit.com/a.pdf',
        'https://PROD.0CODEKIT.COM/a.pdf',
    ])('accepts %s', (url) => {
        expect(() => zeroCodeKitFiles.assertZeroCodeKitUrl(url)).not.toThrow();
    });

    it.each([
        ['cloud metadata over http', 'http://169.254.169.254/latest/meta-data/'],
        ['cloud metadata over https', 'https://169.254.169.254/latest/meta-data/iam/security-credentials/'],
        ['GCP metadata host', 'https://metadata.google.internal/computeMetadata/v1/'],
        ['localhost', 'https://localhost/secret'],
        ['plain http on a 0CodeKit host', 'http://prod.0codekit.com/a.pdf'],
        ['look-alike suffix', 'https://prod.0codekit.com.evil.example/a.pdf'],
        ['look-alike prefix', 'https://evil0codekit.com/a.pdf'],
        ['short-link domain', 'https://lyl.ai/abc'],
        ['non-default port', 'https://prod.0codekit.com:8443/a.pdf'],
        ['embedded credentials', 'https://user:pass@prod.0codekit.com/a.pdf'],
        ['file scheme', 'file:///etc/passwd'],
        ['not a URL', 'not a url'],
    ])('refuses %s before any request', async (_label, url) => {
        await expect(zeroCodeKitFiles.download({ url, failure: 'failed' })).rejects.toThrow(/Refusing to download|not a valid URL/);
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('does not follow a redirect and says so', async () => {
        sendRequest.mockRejectedValueOnce(new HttpError({}, { status: 302, responseBody: '' }));
        await expect(zeroCodeKitFiles.download({ url: 'https://prod.0codekit.com/a.pdf', failure: 'Download failed.' })).rejects.toThrow(
            /redirect \(302\), which is not followed/,
        );
    });

    it('Split PDF refuses a foreign part link before downloading any part', async () => {
        respond({ pdfUrls: ['https://prod.0codekit.com/a.pdf', 'http://169.254.169.254/latest/meta-data/'] });
        await expect(runAction({ action: splitPdfAction, propsValue: { pdf: PDF, mode: 'interval', interval: 1 }, write })).rejects.toThrow(
            /Refusing to download/,
        );
        expect(sendRequest).toHaveBeenCalledTimes(1);
        expect(write).not.toHaveBeenCalled();
    });

    it('Split PDF downloads parts with no redirects and a bounded timeout', async () => {
        respond({ pdfUrls: ['https://prod.0codekit.com/a.pdf'] });
        respond(binary('%PDF-a'));
        await runAction({ action: splitPdfAction, propsValue: { pdf: PDF, mode: 'interval', interval: 1 }, write });
        expect(call(1).followRedirects).toBe(false);
        expect(call(1).timeout).toBeGreaterThan(0);
        expect(call(1).timeout).toBeLessThanOrEqual(120_000);
    });

    it('Split PDF stops when the download budget is spent', async () => {
        const now = vi.spyOn(Date, 'now');
        now.mockReturnValueOnce(0).mockReturnValue(480_001);
        respond({ pdfUrls: ['https://prod.0codekit.com/a.pdf'] });
        await expect(runAction({ action: splitPdfAction, propsValue: { pdf: PDF, mode: 'interval', interval: 1 }, write })).rejects.toThrow(
            /took too long/,
        );
        expect(sendRequest).toHaveBeenCalledTimes(1);
        now.mockRestore();
    });

    it('Generate QR Code refuses a foreign image link', async () => {
        respond(binary(JSON.stringify({ imageUrl: 'https://169.254.169.254/qr.png' })));
        await expect(runAction({ action: generateQrCodeAction, propsValue: { data: 'hi' }, write })).rejects.toThrow(/Refusing to download/);
        expect(sendRequest).toHaveBeenCalledTimes(1);
    });

    it('Get a Perm File refuses a foreign download link', async () => {
        respond({ url: 'https://attacker.example/f1.pdf' });
        await expect(runAction({ action: getAPermFileAction, propsValue: { fileId: 'f1' }, write })).rejects.toThrow(/Refusing to download/);
        expect(sendRequest).toHaveBeenCalledTimes(1);
    });

    it('Get a Perm File with Link Only returns the link without downloading it', async () => {
        respond({ url: 'https://attacker.example/f1.pdf' });
        await expect(runAction({ action: getAPermFileAction, propsValue: { fileId: 'f1', linkOnly: true }, write })).resolves.toEqual({
            file_id: 'f1',
            url: 'https://attacker.example/f1.pdf',
        });
        expect(sendRequest).toHaveBeenCalledTimes(1);
    });

    it('keeps path separators out of a downloaded file name', () => {
        expect(zeroCodeKitStorage.fileNameFromUrl({ url: 'https://prod.0codekit.com/f/..%2F..%2Fetc%2Fpasswd', fallback: 'f1' })).toBe(
            '.._.._etc_passwd',
        );
        expect(zeroCodeKitStorage.fileNameFromUrl({ url: 'https://prod.0codekit.com/', fallback: 'f1' })).toBe('f1');
    });
});

describe('file inputs', () => {
    it('recognises a file from another framework copy by its shape', () => {
        const foreign = { filename: 'a.pdf', extension: 'pdf', data: Buffer.from('x'), base64: 'eA==' };
        expect(zeroCodeKitPdf.isApFile(foreign)).toBe(true);
        expect(zeroCodeKitPdf.isApFile(PDF)).toBe(true);
        expect(zeroCodeKitPdf.isApFile({ filename: 'a.pdf' })).toBe(false);
        expect(zeroCodeKitPdf.isApFile(null)).toBe(false);
    });

    it('never uses instanceof ApFile in the piece source', () => {
        const offenders = sourceFiles(join(__dirname, '..', 'src')).filter((file) =>
            /instanceof\s+ApFile/.test(readFileSync(file, 'utf8')),
        );
        expect(offenders).toEqual([]);
    });
});

function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
        const path = join(dir, entry);
        return statSync(path).isDirectory() ? sourceFiles(path) : path.endsWith('.ts') ? [path] : [];
    });
}

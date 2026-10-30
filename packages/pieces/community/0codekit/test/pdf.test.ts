import { ApFile } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPdfFromHtmlAction } from '../src/lib/actions/pdf/create-pdf-from-html';
import { createPdfFromUrlAction } from '../src/lib/actions/pdf/create-pdf-from-url';
import { getPdfPageCountAction } from '../src/lib/actions/pdf/get-pdf-page-count';
import { mergePdfsAction } from '../src/lib/actions/pdf/merge-pdfs';
import { splitPdfAction } from '../src/lib/actions/pdf/split-pdf';
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
const PDF_B64 = Buffer.from('%PDF-in').toString('base64');
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

describe('pdf actions', () => {
    it('Gets PDF page count sends the file as base64', async () => {
        respond({ pageCount: 7 });

        await expect(runAction({ action: getPdfPageCountAction, propsValue: { pdf: PDF }, write })).resolves.toEqual({ page_count: 7 });
        expect(call(0).url).toBe('https://v2.1saas.co/pdf/count');
        expect(call(0).headers).toEqual({ auth: 'zck_test' });
        expect(call(0).body).toEqual({ buffer: PDF_B64 });
    });

    it('Creates a PDF from HTML requests binary and saves it', async () => {
        respond(binary('%PDF-html'));

        const result = await runAction({ action: createPdfFromHtmlAction, propsValue: {
            html: '<h1>Hi</h1>',
            fileName: 'invoice',
            format: 'Letter',
            landscape: true,
            margin: ' 1cm ',
            scale: 1.5,
            pageRanges: '',
        }, write });

        expect(call(0).url).toBe('https://v2.1saas.co/pdf/html');
        expect(call(0).responseType).toBe('arraybuffer');
        expect(call(0).body).toEqual({
            html: '<h1>Hi</h1>',
            getAsUrl: false,
            options: {
                format: 'Letter',
                landscape: true,
                printBackground: true,
                displayHeaderFooter: false,
                scale: 1.5,
                margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' },
            },
        });
        expect(write).toHaveBeenCalledWith({ fileName: 'invoice.pdf', data: Buffer.from('%PDF-html') });
        expect(result).toEqual({ file: 'file://invoice.pdf', file_name: 'invoice.pdf', size_bytes: 9 });
    });

    it('Creates a PDF from HTML rejects a scale out of range', async () => {
        await expect(runAction({ action: createPdfFromHtmlAction, propsValue: { html: '<p/>', scale: 3 }, write })).rejects.toThrow(/Scale/);
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('Creates a PDF file from URL sends the url with default options', async () => {
        respond(binary('%PDF-url'));

        const result = await runAction({ action: createPdfFromUrlAction, propsValue: { url: ' https://example.com ' }, write });

        expect(call(0).url).toBe('https://v2.1saas.co/pdf/html');
        expect(call(0).body).toEqual({
            url: 'https://example.com',
            getAsUrl: false,
            options: { format: 'A4', landscape: false, printBackground: true, displayHeaderFooter: false },
        });
        expect(result).toMatchObject({ file_name: 'webpage.pdf' });
    });

    it('Creates a PDF file from URL rejects a bare domain', async () => {
        await expect(runAction({ action: createPdfFromUrlAction, propsValue: { url: 'example.com' }, write })).rejects.toThrow(/https/);
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('Merges multiple PDFs keeps order and optional pages', async () => {
        respond(binary('%PDF-merged'));

        const result = await runAction({ action: mergePdfsAction, propsValue: {
            pdfs: [{ file: PDF, pages: ' 1-2 ' }, { file: PDF, pages: '' }],
        }, write });

        expect(call(0).url).toBe('https://v2.1saas.co/pdf/merge');
        expect(call(0).body).toEqual({
            files: [{ buffer: PDF_B64, pages: '1-2' }, { buffer: PDF_B64 }],
            getAsUrl: false,
        });
        expect(result).toMatchObject({ file_name: 'merged.pdf', merged_count: 2 });
    });

    it('Merges multiple PDFs accepts files built by the engine\'s own framework copy', async () => {
        respond(binary('%PDF-merged'));
        const foreignFile = {
            filename: 'in.pdf',
            data: Buffer.from('%PDF-in'),
            extension: 'pdf',
            get base64() {
                return this.data.toString('base64');
            },
        };

        await runAction({ action: mergePdfsAction, propsValue: { pdfs: [{ file: foreignFile }, { file: foreignFile }] }, write });

        expect(call(0).body).toEqual({ files: [{ buffer: PDF_B64 }, { buffer: PDF_B64 }], getAsUrl: false });
    });

    it('Merges multiple PDFs needs at least two files', async () => {
        await expect(runAction({ action: mergePdfsAction, propsValue: { pdfs: [{ file: PDF }] }, write })).rejects.toThrow(/at least two/);
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('Splits a PDF by interval and downloads every part', async () => {
        respond({ pdfUrls: ['https://prod.0codekit.com/a.pdf', 'https://prod.0codekit.com/b.pdf'] });
        respond(binary('%PDF-a'));
        respond(binary('%PDF-b'));

        const result = await runAction({ action: splitPdfAction, propsValue: { pdf: PDF, mode: 'interval', interval: 2, fileName: 'chapter.pdf' }, write });

        expect(call(0).url).toBe('https://v2.1saas.co/pdf/split');
        expect(call(0).body).toEqual({ buffer: PDF_B64, interval: 2 });
        expect(call(1)).toMatchObject({ method: 'GET', url: 'https://prod.0codekit.com/a.pdf', responseType: 'arraybuffer' });
        expect(call(2).url).toBe('https://prod.0codekit.com/b.pdf');
        expect(result).toEqual([
            { file: 'file://chapter-1.pdf', file_name: 'chapter-1.pdf', size_bytes: 6 },
            { file: 'file://chapter-2.pdf', file_name: 'chapter-2.pdf', size_bytes: 6 },
        ]);
    });

    it('Splits a PDF by page ranges', async () => {
        respond({ pdfUrls: [] });

        await expect(runAction({ action: splitPdfAction, propsValue: { pdf: PDF, mode: 'pages', pageRanges: ['1-3', ' ', '4-^1'] }, write })).resolves.toEqual([]);
        expect(call(0).body).toEqual({ buffer: PDF_B64, pages: ['1-3', '4-^1'] });
    });

    it('Splits a PDF rejects an invalid interval', async () => {
        await expect(runAction({ action: splitPdfAction, propsValue: { pdf: PDF, mode: 'interval', interval: 0 }, write })).rejects.toThrow(/Pages per File/);
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('surfaces 0CodeKit errors', async () => {
        sendRequest.mockRejectedValueOnce(new Error('boom'));

        await expect(runAction({ action: getPdfPageCountAction, propsValue: { pdf: PDF }, write })).rejects.toThrow('boom');
    });
});

import { ApFile } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { decodeQrCodeAction } from '../src/lib/actions/image/decode-qr-code';
import { generateQrCodeAction } from '../src/lib/actions/image/generate-qr-code';
import { imageExifAction } from '../src/lib/actions/image/image-exif';
import { addTemporaryFileAction } from '../src/lib/actions/temp-file/add-temporary-file';
import { runAction } from './helpers';

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

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const IMAGE = new ApFile('photo.jpg', Buffer.from('jpeg-bytes'), 'jpg');

function respond(body: unknown) {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
}

function sent(index = 0) {
    return sendRequest.mock.calls[index][0];
}

function toArrayBuffer(data: Buffer): ArrayBuffer {
    return new Uint8Array(data).buffer;
}

beforeEach(() => {
    sendRequest.mockReset();
    write.mockReset();
    write.mockResolvedValue('file://stored');
});

describe('actions metadata', () => {
    it.each([
        [decodeQrCodeAction, 'Decode a QRCode'],
        [generateQrCodeAction, 'Generate a QRCode'],
        [imageExifAction, 'Image Exif'],
        [addTemporaryFileAction, 'Add a Temporary File and Recieve a URL'],
    ])('%# has the Workato display name and AI metadata', (action, displayName) => {
        expect(action.displayName).toBe(displayName);
        expect(action.audience).toBe('both');
        expect(action.classification).toBeDefined();
        expect(action.aiMetadata?.description?.length).toBeGreaterThan(20);
    });
});

describe('Decode a QRCode', () => {
    it('sends the file as base64 and returns the decoded data', async () => {
        respond({ data: 'https://example.com' });
        const result = await runAction({ action: decodeQrCodeAction, propsValue: { file: IMAGE, url: 'https://ignored.test/qr.png' }, write });
        expect(sent().url).toBe('https://v2.1saas.co/generate/qrcode/decode');
        expect(sent().headers).toEqual({ auth: 'zck_test' });
        expect(sent().body).toEqual({ buffer: IMAGE.base64 });
        expect(result).toEqual({ data: 'https://example.com' });
    });

    it('falls back to the URL', async () => {
        respond({ data: 'hello' });
        await runAction({ action: decodeQrCodeAction, propsValue: { url: ' https://example.com/qr.png ' }, write });
        expect(sent().body).toEqual({ url: 'https://example.com/qr.png' });
    });

    it('requires a file or a URL', async () => {
        await expect(runAction({ action: decodeQrCodeAction, propsValue: {}, write })).rejects.toThrow('Provide either an Image File or an Image URL.');
        expect(sendRequest).not.toHaveBeenCalled();
    });
});

describe('Image Exif', () => {
    it('returns the EXIF data', async () => {
        respond({ exifData: { Make: 'Canon' } });
        const result = await runAction({ action: imageExifAction, propsValue: { file: IMAGE }, write });
        expect(sent().url).toBe('https://v2.1saas.co/image/exif');
        expect(sent().body).toEqual({ buffer: IMAGE.base64 });
        expect(result).toEqual({ exif_data: { Make: 'Canon' } });
    });

    it('returns an empty object when there is no EXIF data', async () => {
        respond({});
        expect(await runAction({ action: imageExifAction, propsValue: { url: 'https://example.com/a.jpg' }, write })).toEqual({ exif_data: {} });
    });
});

describe('Generate a QRCode', () => {
    it('builds nested options and saves a binary PNG response', async () => {
        respond(toArrayBuffer(PNG));
        const result = await runAction({ action: generateQrCodeAction, propsValue: {
            data: 'https://example.com',
            fileName: 'ticket',
            width: 300,
            errorCorrectionLevel: 'H',
            dotsType: 'rounded',
            dotsColor: 'FF0000',
            cornersDotColor: '#00FF00',
            image: 'https://example.com/logo.png',
            hideBackgroundDots: true,
        }, write });
        expect(sent().url).toBe('https://v2.1saas.co/generate/qrcode/encode');
        expect(sent().responseType).toBe('arraybuffer');
        expect(sent().body).toEqual({
            data: 'https://example.com',
            width: 300,
            image: 'https://example.com/logo.png',
            qrOptions: { errorCorrectionLevel: 'H' },
            dotsOptions: { type: 'rounded', color: '#FF0000' },
            cornersDotOptions: { color: '#00FF00' },
            imageOptions: { hideBackgroundDots: true },
        });
        expect(write).toHaveBeenCalledWith({ fileName: 'ticket.png', data: PNG });
        expect(result).toEqual({ file: 'file://stored', file_name: 'ticket.png', size_bytes: PNG.length, image_url: null });
    });

    it('omits logo options when no logo is set', async () => {
        respond(toArrayBuffer(PNG));
        await runAction({ action: generateQrCodeAction, propsValue: { data: 'x', hideBackgroundDots: true }, write });
        expect(sent().body).toEqual({ data: 'x' });
    });

    it('downloads the image when the API returns an image URL', async () => {
        respond(toArrayBuffer(Buffer.from(JSON.stringify({ imageUrl: 'https://prod.0codekit.com/qr.png', fileName: 'qr.png' }))));
        respond(toArrayBuffer(PNG));
        const result = await runAction({ action: generateQrCodeAction, propsValue: { data: 'x', fileName: 'qr-code.png' }, write });
        expect(sent(1)).toMatchObject({ method: 'GET', url: 'https://prod.0codekit.com/qr.png', responseType: 'arraybuffer' });
        expect(write).toHaveBeenCalledWith({ fileName: 'qr-code.png', data: PNG });
        expect(result).toMatchObject({ file_name: 'qr-code.png', image_url: 'https://prod.0codekit.com/qr.png' });
    });

    it('decodes a data URI image URL without downloading', async () => {
        const dataUri = `data:image/png;base64,${PNG.toString('base64')}`;
        respond(toArrayBuffer(Buffer.from(JSON.stringify({ imageUrl: dataUri }))));
        await runAction({ action: generateQrCodeAction, propsValue: { data: 'x' }, write });
        expect(sendRequest).toHaveBeenCalledTimes(1);
        expect(write).toHaveBeenCalledWith({ fileName: 'qr-code.png', data: PNG });
    });

    it('fails when the response has no image', async () => {
        respond(toArrayBuffer(Buffer.from('{}')));
        await expect(runAction({ action: generateQrCodeAction, propsValue: { data: 'x' }, write })).rejects.toThrow('did not return a QR code image');
        expect(write).not.toHaveBeenCalled();
    });
});

describe('Add a Temporary File and Recieve a URL', () => {
    it('uploads the file and returns the URL', async () => {
        respond({ url: 'https://temp.test/abc', fileName: 'photo.jpg' });
        const result = await runAction({ action: addTemporaryFileAction, propsValue: { file: IMAGE }, write });
        expect(sent().url).toBe('https://v2.1saas.co/storage/temp');
        expect(sent().body).toEqual({ buffer: IMAGE.base64, fileName: 'photo.jpg' });
        expect(result).toEqual({ url: 'https://temp.test/abc', file_name: 'photo.jpg' });
    });

    it('uses the custom file name', async () => {
        respond({ url: 'https://temp.test/abc', fileName: 'renamed.jpg' });
        await runAction({ action: addTemporaryFileAction, propsValue: { file: IMAGE, fileName: ' renamed.jpg ' }, write });
        expect(sent().body).toEqual({ buffer: IMAGE.base64, fileName: 'renamed.jpg' });
    });
});

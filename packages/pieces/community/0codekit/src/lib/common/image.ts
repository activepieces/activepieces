import { ApFile, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitFiles } from './files';

export const zeroCodeKitImage = {
    imageFileProp,
    imageUrlProp,
    imageSource,
    resolveImage,
};

function imageFileProp({ description }: { description: string }) {
    return Property.File({
        displayName: 'Image File',
        description,
        required: false,
    });
}

function imageUrlProp({ description }: { description: string }) {
    return Property.ShortText({
        displayName: 'Image URL',
        description,
        required: false,
    });
}

function imageSource({ file, url }: { file: ApFile | undefined | null; url: string | undefined | null }): ImageSource {
    if (file) {
        return { buffer: zeroCodeKitFiles.toBase64(file) };
    }
    const trimmed = (url ?? '').trim();
    if (trimmed !== '') {
        return { url: trimmed };
    }
    throw new Error('Provide either an Image File or an Image URL.');
}

function isPng(data: Buffer): boolean {
    return data.length >= PNG_SIGNATURE.length && data.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
}

function parseJson(data: Buffer): Record<string, unknown> | undefined {
    try {
        const parsed: unknown = JSON.parse(data.toString('utf8'));
        return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
            ? Object.fromEntries(Object.entries(parsed))
            : undefined;
    } catch {
        return undefined;
    }
}

async function resolveImage(data: Buffer): Promise<ResolvedImage> {
    if (isPng(data)) {
        return { data, imageUrl: null };
    }
    const json = parseJson(data);
    const imageUrl = json && typeof json['imageUrl'] === 'string' ? json['imageUrl'] : undefined;
    if (imageUrl === undefined || imageUrl === '') {
        throw new Error('0CodeKit did not return a QR code image.');
    }
    const dataUri = imageUrl.match(/^data:[^;]+;base64,(.*)$/);
    if (dataUri) {
        return { data: Buffer.from(dataUri[1], 'base64'), imageUrl: null };
    }
    return { data: await zeroCodeKitFiles.download({ url: imageUrl, failure: 'Downloading the generated image failed.' }), imageUrl };
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export type ImageSource = { buffer: string } | { url: string };

export type ResolvedImage = {
    data: Buffer;
    imageUrl: string | null;
};

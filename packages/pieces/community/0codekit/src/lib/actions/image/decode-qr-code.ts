import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitImage } from '../../common/image';
import { filesStorageOutputSchemas } from '../../common/output-schemas/files-storage';

export const decodeQrCodeAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'decode_qr_code',
    classification: 'READ',
    displayName: 'Decode a QRCode',
    description: 'Read the text or link stored in a QR code image.',
    audience: 'both',
    aiMetadata: {
        description:
            'Decode a QR code image and return the text it contains (often a URL). Provide the image either as a file from an earlier step or as a public image URL; if both are given the file is used. Supported formats: JPG, PNG, BMP, TIFF, GIF. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        file: zeroCodeKitImage.imageFileProp({
            description: 'The QR code image (JPG, PNG, BMP, TIFF or GIF). Use this or Image URL.',
        }),
        url: zeroCodeKitImage.imageUrlProp({
            description: 'A public link to the QR code image. Used only when no Image File is provided.',
        }),
    },
    outputSchema: filesStorageOutputSchemas.decodedQrCode,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<DecodeQrCodeResponse>({
            apiKey: auth.secret_text,
            path: '/generate/qrcode/decode',
            body: zeroCodeKitImage.imageSource({ file: propsValue.file, url: propsValue.url }),
        });
        return { data: response.data ?? null };
    },
});

type DecodeQrCodeResponse = {
    data?: string;
};

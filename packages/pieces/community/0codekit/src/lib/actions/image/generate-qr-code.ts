import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitFiles } from '../../common/files';
import { zeroCodeKitImage } from '../../common/image';
import { filesStorageOutputSchemas } from '../../common/output-schemas/files-storage';

export const generateQrCodeAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'generate_qr_code',
    classification: 'READ',
    displayName: 'Generate a QRCode',
    description: 'Create a QR code image (PNG) from text or a link.',
    audience: 'both',
    aiMetadata: {
        description:
            'Generate a styled QR code PNG image that encodes the given text or URL. Optional settings control size, margin, colors, dot and corner styles, error correction and a logo placed in the middle. Returns a file reference to the PNG that later steps can attach or upload. Creates nothing in any external account and is safe to retry.',
        idempotent: true,
    },
    props: {
        data: Property.LongText({
            displayName: 'Content',
            description: 'The text or link to encode in the QR code.',
            required: true,
        }),
        fileName: Property.ShortText({
            displayName: 'File Name',
            description: 'The name of the generated image file. ".png" is added when missing.',
            required: false,
            defaultValue: 'qr-code.png',
        }),
        width: Property.Number({
            displayName: 'Width (px)',
            description: 'The width of the image in pixels. Default is 500.',
            required: false,
        }),
        height: Property.Number({
            displayName: 'Height (px)',
            description: 'The height of the image in pixels. Default is 500.',
            required: false,
        }),
        margin: Property.Number({
            displayName: 'Margin (px)',
            description: 'Empty space around the QR code, in pixels. Default is 15.',
            required: false,
        }),
        errorCorrectionLevel: Property.StaticDropdown({
            displayName: 'Error Correction Level',
            description: 'How much of the code can be covered and still read. Default is Q.',
            required: false,
            options: {
                options: [
                    { label: 'Low (7%)', value: 'L' },
                    { label: 'Medium (15%)', value: 'M' },
                    { label: 'Quartile (25%)', value: 'Q' },
                    { label: 'High (30%)', value: 'H' },
                ],
            },
        }),
        dotsType: Property.StaticDropdown({
            displayName: 'Dot Style',
            description: 'The shape of the dots that make up the code. Default is square.',
            required: false,
            options: {
                options: [
                    { label: 'Square', value: 'square' },
                    { label: 'Dots', value: 'dots' },
                    { label: 'Rounded', value: 'rounded' },
                    { label: 'Extra Rounded', value: 'extra-rounded' },
                    { label: 'Classy', value: 'classy' },
                    { label: 'Classy Rounded', value: 'classy-rounded' },
                ],
            },
        }),
        dotsColor: Property.ShortText({
            displayName: 'Dot Color',
            description: 'The color of the dots as a hex code. Default is black.',
            required: false,
            placeholder: '#000000',
        }),
        cornersSquareType: Property.StaticDropdown({
            displayName: 'Corner Square Style',
            description: 'The shape of the three large corner squares. Default is square.',
            required: false,
            options: {
                options: [
                    { label: 'Square', value: 'square' },
                    { label: 'Extra Rounded', value: 'extra-rounded' },
                    { label: 'Dot', value: 'dot' },
                ],
            },
        }),
        cornersSquareColor: Property.ShortText({
            displayName: 'Corner Square Color',
            description: 'The color of the corner squares as a hex code. Default is black.',
            required: false,
            placeholder: '#000000',
        }),
        cornersDotType: Property.StaticDropdown({
            displayName: 'Corner Dot Style',
            description: 'The shape of the dot inside each corner square. Default is square.',
            required: false,
            options: {
                options: [
                    { label: 'Square', value: 'square' },
                    { label: 'Dot', value: 'dot' },
                ],
            },
        }),
        cornersDotColor: Property.ShortText({
            displayName: 'Corner Dot Color',
            description: 'The color of the corner dots as a hex code. Default is black.',
            required: false,
            placeholder: '#000000',
        }),
        image: Property.ShortText({
            displayName: 'Logo URL',
            description: 'A public image link shown in the middle; use a high error correction.',
            required: false,
            placeholder: 'https://example.com/logo.png',
        }),
        hideBackgroundDots: Property.Checkbox({
            displayName: 'Hide Dots Behind Logo',
            description: 'Remove dots behind the logo (default on); needs a Logo URL.',
            required: false,
            defaultValue: true,
        }),
        imageMargin: Property.Number({
            displayName: 'Logo Margin (px)',
            description: 'Space around the logo in pixels (default 0); needs a Logo URL.',
            required: false,
        }),
    },
    outputSchema: filesStorageOutputSchemas.generatedQrCode,
    async run({ auth, propsValue, files }) {
        const hasImage = (propsValue.image ?? '').trim() !== '';
        const binary = await zeroCodeKitFiles.postForBinary({
            apiKey: auth.secret_text,
            path: '/generate/qrcode/encode',
            body: compact({
                data: propsValue.data,
                width: propsValue.width,
                height: propsValue.height,
                margin: propsValue.margin,
                image: hasImage ? (propsValue.image ?? '').trim() : undefined,
                qrOptions: compact({ errorCorrectionLevel: propsValue.errorCorrectionLevel }),
                dotsOptions: compact({ type: propsValue.dotsType, color: hexColor(propsValue.dotsColor) }),
                cornersSquareOptions: compact({
                    type: propsValue.cornersSquareType,
                    color: hexColor(propsValue.cornersSquareColor),
                }),
                cornersDotOptions: compact({
                    type: propsValue.cornersDotType,
                    color: hexColor(propsValue.cornersDotColor),
                }),
                imageOptions: hasImage
                    ? compact({
                          hideBackgroundDots: propsValue.hideBackgroundDots,
                          margin: propsValue.imageMargin,
                      })
                    : undefined,
            }),
        });
        const image = await zeroCodeKitImage.resolveImage(binary);
        const saved = await zeroCodeKitFiles.save({
            files,
            fileName: zeroCodeKitFiles.withExtension({ name: (propsValue.fileName ?? '').trim() || 'qr-code', extension: 'png' }),
            data: image.data,
        });
        return { ...saved, image_url: image.imageUrl };
    },
});

function hexColor(value: string | undefined): string | undefined {
    const trimmed = (value ?? '').trim();
    if (trimmed === '') {
        return undefined;
    }
    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function compact(body: Record<string, unknown>): Record<string, unknown> | undefined {
    const entries = Object.entries(body).filter(([, value]) => value !== undefined && value !== null && value !== '');
    return entries.length === 0 ? undefined : Object.fromEntries(entries);
}

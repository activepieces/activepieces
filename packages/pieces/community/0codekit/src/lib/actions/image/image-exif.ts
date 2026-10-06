import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitImage } from '../../common/image';
import { filesStorageOutputSchemas } from '../../common/output-schemas/files-storage';

export const imageExifAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'image_exif',
    classification: 'READ',
    displayName: 'Image Exif',
    description: 'Read the EXIF details of a photo, such as camera, date taken and GPS location.',
    audience: 'both',
    aiMetadata: {
        description:
            'Extract the EXIF metadata embedded in an image (camera make and model, capture date, exposure, GPS coordinates, and so on). Provide the image as a file from an earlier step or as a public image URL; if both are given the file is used. Returns the EXIF tags as an object, empty when the image has none. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        file: zeroCodeKitImage.imageFileProp({
            description: 'The image to inspect, usually a JPG photo. Use this or Image URL.',
        }),
        url: zeroCodeKitImage.imageUrlProp({
            description: 'A public link to the image. Used only when no Image File is provided.',
        }),
    },
    outputSchema: filesStorageOutputSchemas.imageExif,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<ImageExifResponse>({
            apiKey: auth.secret_text,
            path: '/image/exif',
            body: zeroCodeKitImage.imageSource({ file: propsValue.file, url: propsValue.url }),
        });
        return { exif_data: response.exifData ?? {} };
    },
});

type ImageExifResponse = {
    exifData?: unknown;
};

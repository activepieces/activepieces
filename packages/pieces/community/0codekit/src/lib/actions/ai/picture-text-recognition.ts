import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitAi } from '../../common/ai';
import { zeroCodeKitApi } from '../../common/client';
import { businessAiOutputSchemas } from '../../common/output-schemas/business-ai';

export const pictureTextRecognitionAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'picture_text_recognition',
    classification: 'READ',
    displayName: 'Picture Text Recognition',
    description: 'Read the text shown in an image (OCR).',
    audience: 'both',
    aiMetadata: {
        description:
            'Run optical character recognition on an image reachable by a public URL and return every line of text found, both as a list and joined into one text with line breaks. The image must be a publicly accessible link; files from earlier steps are not accepted by this endpoint. Nothing is stored; safe to retry.',
        idempotent: true,
    },
    props: {
        imageUrl: zeroCodeKitAi.imageUrlProp({
            description: 'A public link to the image to read text from (JPG, PNG, BMP, TIFF or GIF).',
        }),
    },
    outputSchema: businessAiOutputSchemas.pictureTextRecognition,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<PictureTextRecognitionResponse>({
            apiKey: auth.secret_text,
            path: '/ai/picturetextrecognition',
            body: { imageUrl: zeroCodeKitAi.requireText({ value: propsValue.imageUrl, label: 'Image URL' }) },
        });
        const lines = zeroCodeKitAi.stringList(response.recognizedTexts);
        return { text: lines.join('\n'), line_count: lines.length, lines };
    },
});

type PictureTextRecognitionResponse = {
    recognizedTexts?: unknown;
};

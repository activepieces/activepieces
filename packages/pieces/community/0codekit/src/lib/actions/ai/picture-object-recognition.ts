import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitAi } from '../../common/ai';
import { zeroCodeKitApi } from '../../common/client';
import { businessAiOutputSchemas } from '../../common/output-schemas/business-ai';

export const pictureObjectRecognitionAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'picture_object_recognition',
    classification: 'READ',
    displayName: 'Picture Object Recognition',
    description: 'List the objects and things that appear in an image.',
    audience: 'both',
    aiMetadata: {
        description:
            'Look at an image reachable by a public URL and return a list of short labels describing the objects, scenes and concepts it shows (for example `dog`, `beach`, `sunset`). The image must be a publicly accessible link; files from earlier steps are not accepted by this endpoint. Nothing is stored; safe to retry, though labels can vary slightly between calls.',
        idempotent: true,
    },
    props: {
        imageUrl: zeroCodeKitAi.imageUrlProp({
            description: 'A public link to the image to analyze (JPG, PNG, GIF or WEBP).',
        }),
    },
    outputSchema: businessAiOutputSchemas.pictureObjectRecognition,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<PictureObjectRecognitionResponse>({
            apiKey: auth.secret_text,
            path: '/ai/pictureobjectrecognition',
            body: { imageUrl: zeroCodeKitAi.requireText({ value: propsValue.imageUrl, label: 'Image URL' }) },
        });
        const labels = zeroCodeKitAi.stringList(response.recognizedLabels);
        return { label_count: labels.length, labels };
    },
});

type PictureObjectRecognitionResponse = {
    recognizedLabels?: unknown;
};

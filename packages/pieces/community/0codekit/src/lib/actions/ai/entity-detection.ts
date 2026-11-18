import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitAi } from '../../common/ai';
import { zeroCodeKitApi } from '../../common/client';
import { businessAiOutputSchemas } from '../../common/output-schemas/business-ai';

export const entityDetectionAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'entity_detection',
    classification: 'READ',
    displayName: 'Entity Detection',
    description: 'Find people, places, organizations, dates and other named entities in a text.',
    audience: 'both',
    aiMetadata: {
        description:
            'Run named-entity recognition on a text and return every entity found (for example a person, location, organization, date, quantity, email or URL) with its category, optional sub-category, character offset, length and a confidence score between 0 and 1. Nothing is stored; safe to retry.',
        idempotent: true,
    },
    props: {
        text: zeroCodeKitAi.textProp({ description: 'The text to scan for entities.' }),
    },
    outputSchema: businessAiOutputSchemas.entityDetection,
    async run({ auth, propsValue }) {
        const text = zeroCodeKitAi.requireText({ value: propsValue.text, label: 'Text' });
        const leadingWhitespace = (propsValue.text ?? '').length - (propsValue.text ?? '').trimStart().length;
        const response = await zeroCodeKitApi.post<EntityDetectionResponse>({
            apiKey: auth.secret_text,
            path: '/ai/entitydetection',
            body: { text },
        });
        const entities = (response.detections ?? []).map((detection) => ({
            text: detection.text ?? null,
            category: detection.category ?? null,
            sub_category: detection.subCategory ?? null,
            offset: typeof detection.offset === 'number' ? detection.offset + leadingWhitespace : null,
            length: detection.length ?? null,
            confidence_score: detection.confidenceScore ?? null,
        }));
        return { entity_count: entities.length, entities };
    },
});

type EntityDetectionResponse = {
    detections?: {
        text?: string;
        category?: string;
        subCategory?: string;
        offset?: number;
        length?: number;
        confidenceScore?: number;
    }[];
};

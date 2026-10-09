import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitAi } from '../../common/ai';
import { zeroCodeKitApi } from '../../common/client';
import { businessAiOutputSchemas } from '../../common/output-schemas/business-ai';

export const languageDetectionAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'language_detection',
    classification: 'READ',
    displayName: 'Language Detection',
    description: 'Detect which language a text is written in.',
    audience: 'both',
    aiMetadata: {
        description:
            'Detect the main language of a text and return its English name, its two-letter ISO 639-1 code (for example `en`, `de`) and a confidence score between 0 and 1. Nothing is stored; safe to retry.',
        idempotent: true,
    },
    props: {
        text: zeroCodeKitAi.textProp({ description: 'The text whose language you want to detect.' }),
    },
    outputSchema: businessAiOutputSchemas.languageDetection,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<LanguageDetectionResponse>({
            apiKey: auth.secret_text,
            path: '/ai/languagedetection',
            body: { text: zeroCodeKitAi.requireText({ value: propsValue.text, label: 'Text' }) },
        });
        return {
            language_name: response.name ?? null,
            language_code: response.iso6391Name ?? null,
            confidence_score: response.confidenceScore ?? null,
        };
    },
});

type LanguageDetectionResponse = {
    name?: string;
    iso6391Name?: string;
    confidenceScore?: number;
};

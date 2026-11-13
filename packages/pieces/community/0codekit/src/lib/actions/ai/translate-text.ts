import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitAi } from '../../common/ai';
import { zeroCodeKitApi } from '../../common/client';
import { businessAiOutputSchemas } from '../../common/output-schemas/business-ai';

export const translateTextAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'translate_text',
    classification: 'READ',
    displayName: 'Translate Text',
    description: 'Translate a text into another language.',
    audience: 'both',
    aiMetadata: {
        description:
            'Translate a text into the chosen target language, given as a two-letter ISO 639-1 code (for example `es` for Spanish, `de` for German). The source language is detected automatically. Returns only the translated text. Nothing is stored; safe to retry, though wording can vary slightly between calls.',
        idempotent: true,
    },
    props: {
        text: zeroCodeKitAi.textProp({ description: 'The text to translate. Any source language is detected automatically.' }),
        resultLang: zeroCodeKitAi.targetLanguageProp(),
    },
    outputSchema: businessAiOutputSchemas.translateText,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<TranslateResponse>({
            apiKey: auth.secret_text,
            path: '/ai/translate',
            body: {
                text: zeroCodeKitAi.requireText({ value: propsValue.text, label: 'Text' }),
                resultLang: zeroCodeKitAi.requireText({ value: propsValue.resultLang, label: 'Target Language' }),
            },
        });
        return {
            translation: response.translation ?? null,
            target_language: propsValue.resultLang,
        };
    },
});

type TranslateResponse = {
    translation?: string;
};

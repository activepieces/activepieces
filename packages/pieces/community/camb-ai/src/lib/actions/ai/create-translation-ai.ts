import { createAction, Property } from '@activepieces/pieces-framework';
import { cambaiAuth } from '../../auth';
import { cambCommon, cambOutputSchemas, FORMALITY_VALUES, GENDER_VALUES } from '../../common';

export const createTranslationAi = createAction({
    auth: cambaiAuth,
    name: 'create_translation_ai',
    classification: 'WRITE',
    displayName: 'Create Translation',
    description: 'Translate text into another language.',
    audience: 'ai',
    outputSchema: cambOutputSchemas['translation'],
    aiMetadata: {
        description: 'Translates text with Camb.AI and waits for the result (up to 5 minutes). Each non-empty line is a separate segment and gets one entry in translations. source_language comes from List Source Languages and target_language from List Target Languages (numeric id or short_name). Spends credits; not idempotent.',
        idempotent: false,
    },
    props: {
        texts: Property.LongText({ displayName: 'Text', description: 'One segment per line.', required: true }),
        source_language: Property.ShortText({
            displayName: 'Source Language',
            description: 'Numeric id or short_name from List Source Languages.',
            required: true,
        }),
        target_language: Property.ShortText({
            displayName: 'Target Language',
            description: 'Numeric id or short_name from List Target Languages.',
            required: true,
        }),
        formality: Property.StaticDropdown({
            displayName: 'Formality',
            required: false,
            options: {
                options: [
                    { label: 'Formal', value: 'formal' },
                    { label: 'Informal', value: 'informal' },
                ],
            },
        }),
        gender: Property.StaticDropdown({
            displayName: 'Gender',
            required: false,
            options: {
                options: [
                    { label: 'Male', value: 'male' },
                    { label: 'Female', value: 'female' },
                    { label: 'Neutral', value: 'neutral' },
                    { label: 'Unspecified', value: 'unspecified' },
                ],
            },
        }),
        age: Property.Number({ displayName: 'Audience Age', required: false }),
        folder_id: Property.ShortText({
            displayName: 'Folder ID',
            description: 'Numeric folder_id from List Folders.',
            required: false,
        }),
    },
    async run(context) {
        const apiKey = context.auth.secret_text;
        const p = context.propsValue;
        return cambCommon.runTranslation({
            apiKey,
            texts: p.texts,
            sourceLanguage: await cambCommon.resolveLanguageId({ apiKey, value: p.source_language, kind: 'source' }),
            targetLanguage: await cambCommon.resolveLanguageId({ apiKey, value: p.target_language, kind: 'target' }),
            formality: cambCommon.mapEnum({ value: p.formality, map: FORMALITY_VALUES, field: 'formality' }),
            gender: cambCommon.mapEnum({ value: p.gender, map: GENDER_VALUES, field: 'gender' }),
            age: p.age ?? undefined,
            folderId: cambCommon.parseOptionalInteger({ value: p.folder_id, field: 'folder_id' }),
        });
    },
});

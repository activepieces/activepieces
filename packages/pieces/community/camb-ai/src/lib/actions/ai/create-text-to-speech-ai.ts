import { createAction, Property } from '@activepieces/pieces-framework';
import { cambaiAuth } from '../../auth';
import { cambCommon, cambOutputSchemas, GENDER_VALUES } from '../../common';

export const createTextToSpeechAi = createAction({
    auth: cambaiAuth,
    name: 'create_text_to_speech_ai',
    classification: 'WRITE',
    displayName: 'Create Text-to-Speech',
    description: 'Convert text into speech with a chosen voice.',
    audience: 'ai',
    outputSchema: cambOutputSchemas['textToSpeech'],
    aiMetadata: {
        description: 'Synthesizes spoken audio from text with Camb.AI, waits for the task (up to 5 minutes) and returns an audio file URL. Get voice_id from List Voices and language (numeric id or short_name such as en-us) from List Source Languages. For non-speech sound effects use Create Text-to-Sound. Spends credits; not idempotent: each call creates a new audio file. On a timeout the error gives the task_id for Get Task Status.',
        idempotent: false,
    },
    props: {
        text: Property.LongText({ displayName: 'Text', required: true }),
        language: Property.ShortText({
            displayName: 'Language',
            description: 'Numeric id or short_name from List Source Languages.',
            required: true,
        }),
        voice_id: Property.ShortText({
            displayName: 'Voice ID',
            description: 'Numeric id from List Voices.',
            required: true,
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
        age: Property.Number({ displayName: 'Age', required: false }),
        folder_id: Property.ShortText({
            displayName: 'Folder ID',
            description: 'Numeric folder_id from List Folders.',
            required: false,
        }),
    },
    async run(context) {
        const apiKey = context.auth.secret_text;
        const p = context.propsValue;
        return cambCommon.runTts({
            apiKey,
            files: context.files,
            text: p.text,
            language: await cambCommon.resolveLanguageId({ apiKey, value: p.language, kind: 'source' }),
            voiceId: cambCommon.parseRequiredInteger({ value: p.voice_id, field: 'voice_id' }),
            gender: cambCommon.mapEnum({ value: p.gender, map: GENDER_VALUES, field: 'gender' }),
            age: p.age ?? undefined,
            folderId: cambCommon.parseOptionalInteger({ value: p.folder_id, field: 'folder_id' }),
        });
    },
});

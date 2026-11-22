import { createAction, Property } from '@activepieces/pieces-framework';
import { cambaiAuth } from '../../auth';
import { cambCommon, cambOutputSchemas } from '../../common';

export const createTranscriptionAi = createAction({
    auth: cambaiAuth,
    name: 'create_transcription_ai',
    classification: 'WRITE',
    displayName: 'Create Transcription',
    description: 'Transcribe speech from a media URL.',
    audience: 'ai',
    outputSchema: cambOutputSchemas['transcription'],
    aiMetadata: {
        description: 'Transcribes speech from a public audio or video URL with Camb.AI and waits for the result (up to about 8 minutes), returning timed transcript segments. language is the spoken language: numeric id or short_name from List Source Languages. Spends credits; not idempotent.',
        idempotent: false,
    },
    props: {
        media_url: Property.ShortText({ displayName: 'Media URL', description: 'Public URL of the audio or video file.', required: true }),
        language: Property.ShortText({
            displayName: 'Language',
            description: 'Numeric id or short_name from List Source Languages.',
            required: true,
        }),
        folder_id: Property.ShortText({
            displayName: 'Folder ID',
            description: 'Numeric folder_id from List Folders.',
            required: false,
        }),
    },
    async run(context) {
        const apiKey = context.auth.secret_text;
        const p = context.propsValue;
        return cambCommon.runTranscription({
            apiKey,
            language: await cambCommon.resolveLanguageId({ apiKey, value: p.language, kind: 'source' }),
            mediaUrl: p.media_url.trim(),
            folderId: cambCommon.parseOptionalInteger({ value: p.folder_id, field: 'folder_id' }),
        });
    },
});

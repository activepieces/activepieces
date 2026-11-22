import { createAction, Property } from '@activepieces/pieces-framework';
import { cambaiAuth } from '../../auth';
import { cambCommon, cambOutputSchemas } from '../../common';

export const createTextToSoundAi = createAction({
    auth: cambaiAuth,
    name: 'create_text_to_sound_ai',
    classification: 'WRITE',
    displayName: 'Create Text-to-Sound',
    description: 'Generate a sound effect from a text prompt.',
    audience: 'ai',
    outputSchema: cambOutputSchemas['textToSound'],
    aiMetadata: {
        description: 'Generates a non-speech sound-effect clip from a descriptive prompt with Camb.AI, waits for the task (up to 5 minutes) and returns an audio file URL. Duration is in seconds, at most 10 (Camb.AI defaults to 8). For spoken voice use Create Text-to-Speech. Spends credits; not idempotent.',
        idempotent: false,
    },
    props: {
        prompt: Property.LongText({ displayName: 'Prompt', required: true }),
        duration: Property.ShortText({
            displayName: 'Duration (seconds)',
            description: 'Number of seconds, up to 10.',
            required: false,
        }),
        folder_id: Property.ShortText({
            displayName: 'Folder ID',
            description: 'Numeric folder_id from List Folders.',
            required: false,
        }),
    },
    async run(context) {
        const p = context.propsValue;
        const raw = p.duration?.trim();
        const duration = raw ? Number(raw) : undefined;
        if (duration !== undefined && Number.isNaN(duration)) {
            throw new Error(`duration must be a number of seconds, got "${raw}".`);
        }
        return cambCommon.runTextToSound({
            apiKey: context.auth.secret_text,
            files: context.files,
            prompt: p.prompt,
            duration,
            folderId: cambCommon.parseOptionalInteger({ value: p.folder_id, field: 'folder_id' }),
        });
    },
});

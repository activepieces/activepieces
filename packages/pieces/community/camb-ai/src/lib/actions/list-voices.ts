import { createAction, Property } from '@activepieces/pieces-framework';
import { cambaiAuth } from '../auth';
import { cambCommon, cambOutputSchemas } from '../common';

export const listVoices = createAction({
    auth: cambaiAuth,
    name: 'list_voices',
    classification: 'SEARCH',
    displayName: 'List Voices',
    description: 'Lists the voices available to the account.',
    audience: 'ai',
    outputSchema: cambOutputSchemas['listVoices'],
    aiMetadata: {
        description: 'Lists Camb.AI voices with their numeric id, name, gender, age and language. Call it to get the voice_id for Create Text-to-Speech. Optionally filter by a case-insensitive substring of the voice name.',
        idempotent: true,
    },
    props: {
        name: Property.ShortText({
            displayName: 'Name Contains',
            description: 'Only voices whose name contains this text.',
            required: false,
        }),
    },
    async run(context) {
        const needle = context.propsValue.name?.trim().toLowerCase() ?? '';
        const voices = await cambCommon.listVoices({ apiKey: context.auth.secret_text });
        return {
            voices: voices
                .filter((voice) => needle === '' || (voice.voice_name ?? '').toLowerCase().includes(needle))
                .map((voice) => ({
                    id: voice.id,
                    voice_name: voice.voice_name,
                    gender: voice.gender ?? null,
                    age: voice.age ?? null,
                    language: voice.language ?? null,
                })),
        };
    },
});

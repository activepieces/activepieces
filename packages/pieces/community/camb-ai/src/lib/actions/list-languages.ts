import { createAction } from '@activepieces/pieces-framework';
import { cambaiAuth } from '../auth';
import { cambCommon, cambOutputSchemas } from '../common';

export const listSourceLanguages = createAction({
    auth: cambaiAuth,
    name: 'list_source_languages',
    classification: 'SEARCH',
    displayName: 'List Source Languages',
    description: 'Lists the languages Camb.AI accepts as input.',
    audience: 'ai',
    outputSchema: cambOutputSchemas['listLanguages'],
    aiMetadata: {
        description: 'Lists Camb.AI source (input) languages with numeric id, name and short_name locale tag (e.g. en-us). Pass the id or short_name as the language for Create Text-to-Speech, Create Transcription, the source of Create Translation, and the short_name as the source of Create Dubbing.',
        idempotent: true,
    },
    props: {},
    async run(context) {
        return { languages: await mapLanguages({ apiKey: context.auth.secret_text, kind: 'source' }) };
    },
});

export const listTargetLanguages = createAction({
    auth: cambaiAuth,
    name: 'list_target_languages',
    classification: 'SEARCH',
    displayName: 'List Target Languages',
    description: 'Lists the languages Camb.AI can translate or dub into.',
    audience: 'ai',
    outputSchema: cambOutputSchemas['listLanguages'],
    aiMetadata: {
        description: 'Lists Camb.AI target (output) languages with numeric id, name and short_name locale tag (e.g. es-es). Pass the id or short_name as the target of Create Translation, and short_names as the targets of Create Dubbing.',
        idempotent: true,
    },
    props: {},
    async run(context) {
        return { languages: await mapLanguages({ apiKey: context.auth.secret_text, kind: 'target' }) };
    },
});

async function mapLanguages({ apiKey, kind }: { apiKey: string; kind: 'source' | 'target' }) {
    const languages = await cambCommon.listLanguages({ apiKey, kind });
    return languages.map((lang) => ({ id: lang.id, language: lang.language, short_name: lang.short_name }));
}

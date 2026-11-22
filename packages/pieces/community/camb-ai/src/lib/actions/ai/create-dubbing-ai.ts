import { createAction, Property } from '@activepieces/pieces-framework';
import { cambaiAuth } from '../../auth';
import { cambCommon, cambOutputSchemas } from '../../common';

export const createDubbingAi = createAction({
    auth: cambaiAuth,
    name: 'create_dubbing_ai',
    classification: 'WRITE',
    displayName: 'Create Dubbing',
    description: 'Start dubbing a video into other languages.',
    audience: 'ai',
    outputSchema: cambOutputSchemas['dubbingAi'],
    aiMetadata: {
        description: 'Starts a Camb.AI dubbing task for a video URL (YouTube, Google Drive or direct link) and returns task_id immediately. Poll Get Task Status (task type dub) until SUCCESS, then call Get Run Result (dub) with the run_id for the dubbed video_url. source_language is a short_name from List Source Languages; target_languages is a comma-separated list of short_names from List Target Languages. Spends credits; not idempotent.',
        idempotent: false,
    },
    props: {
        video_url: Property.ShortText({ displayName: 'Video URL', required: true }),
        source_language: Property.ShortText({
            displayName: 'Source Language',
            description: 'Locale tag such as en-us.',
            required: true,
        }),
        target_languages: Property.ShortText({
            displayName: 'Target Languages',
            description: 'Comma-separated locale tags, e.g. es-es,fr-fr.',
            required: true,
        }),
    },
    async run(context) {
        const p = context.propsValue;
        const taskId = await cambCommon.startDubbing({
            apiKey: context.auth.secret_text,
            videoUrl: p.video_url.trim(),
            sourceLanguage: p.source_language.trim(),
            targetLanguages: cambCommon.splitList(p.target_languages),
        });
        return { task_id: taskId };
    },
});

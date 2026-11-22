import { createAction, Property } from '@activepieces/pieces-framework';
import { cambaiAuth } from '../auth';
import { cambCommon, cambOutputSchemas } from '../common';

export const getRunResult = createAction({
    auth: cambaiAuth,
    name: 'get_run_result',
    classification: 'READ',
    displayName: 'Get Run Result',
    description: 'Fetches the result of a finished translation, transcription or dubbing run.',
    audience: 'both',
    outputSchema: cambOutputSchemas['runResult'],
    aiMetadata: {
        description: 'Fetches the result of a finished Camb.AI run by run_id (from Get Task Status once SUCCESS). Translation returns translations, transcription returns transcript segments, dubbing returns video_url, audio_url and transcript.',
        idempotent: true,
    },
    props: {
        task_type: Property.StaticDropdown({
            displayName: 'Result Type',
            required: true,
            options: {
                options: [
                    { label: 'Translation', value: 'translation' },
                    { label: 'Transcription', value: 'transcription' },
                    { label: 'Dubbing', value: 'dub' },
                ],
            },
        }),
        run_id: Property.ShortText({
            displayName: 'Run ID',
            description: 'The run_id from Get Task Status once the status is SUCCESS.',
            placeholder: 'e.g. 123456',
            required: true,
        }),
    },
    async run(context) {
        const result = await cambCommon.getRunResult({
            apiKey: context.auth.secret_text,
            taskType: context.propsValue.task_type,
            runId: context.propsValue.run_id.trim(),
        });
        return { result };
    },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { cambaiAuth } from '../auth';
import { cambCommon, cambOutputSchemas } from '../common';

export const getTaskStatus = createAction({
    auth: cambaiAuth,
    name: 'get_task_status',
    classification: 'READ',
    displayName: 'Get Task Status',
    description: 'Checks the status of a Camb.AI task.',
    audience: 'both',
    outputSchema: cambOutputSchemas['taskStatus'],
    aiMetadata: {
        description: 'Returns the status of a Camb.AI task (SUCCESS, PENDING, TIMEOUT, ERROR or PAYMENT_REQUIRED) and its run_id once SUCCESS. Use with the task_id from Create Dubbing or a create action that timed out, then pass run_id to Get Run Result. PAYMENT_REQUIRED means the account is out of credits.',
        idempotent: true,
    },
    props: {
        task_type: Property.StaticDropdown({
            displayName: 'Task Type',
            required: true,
            options: {
                options: [
                    { label: 'Text-to-Speech', value: 'tts' },
                    { label: 'Text-to-Sound', value: 'text-to-sound' },
                    { label: 'Translation', value: 'translate' },
                    { label: 'Transcription', value: 'transcribe' },
                    { label: 'Dubbing', value: 'dub' },
                ],
            },
        }),
        task_id: Property.ShortText({
            displayName: 'Task ID',
            description: 'The task_id returned when the task was created.',
            placeholder: 'e.g. 3f1c9a2e-…',
            required: true,
        }),
    },
    async run(context) {
        return cambCommon.getTaskStatus({
            apiKey: context.auth.secret_text,
            taskType: context.propsValue.task_type,
            taskId: context.propsValue.task_id.trim(),
        });
    },
});

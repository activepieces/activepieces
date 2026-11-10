import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitScheduler } from '../../common/scheduler';
import { zeroCodeKitCodeUrlOutputSchemas } from '../../common/output-schemas/code-url';

export const deleteASchedulerAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'delete_a_scheduler',
    classification: 'DESTRUCTIVE',
    displayName: 'Delete a Scheduler',
    description: 'Stop a 0CodeKit scheduler so it no longer calls its webhook.',
    audience: 'both',
    aiMetadata: {
        description:
            'Delete a scheduler task, identified by its task_id from Create a Scheduler or List Schedulers, so its webhook is no longer called. Cannot be undone. Fails if the task no longer exists.',
        idempotent: false,
    },
    props: {
        taskId: zeroCodeKitScheduler.taskId({
            description: 'The scheduler to delete.',
        }),
    },
    outputSchema: zeroCodeKitCodeUrlOutputSchemas.deleteScheduler,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<DeleteTaskResponse>({
            apiKey: auth.secret_text,
            path: '/operator/scheduler/del',
            body: {
                taskId: propsValue.taskId,
            },
        });
        return {
            deleted: true,
            task_id: propsValue.taskId,
            message: response.message ?? null,
        };
    },
});

type DeleteTaskResponse = {
    message?: string;
};

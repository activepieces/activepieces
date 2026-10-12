import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitScheduler } from '../../common/scheduler';
import { zeroCodeKitCodeUrlOutputSchemas } from '../../common/output-schemas/code-url';

export const listSchedulersAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'list_schedulers',
    classification: 'SEARCH',
    displayName: 'List Schedulers',
    description: 'Get every active scheduler in your 0CodeKit account.',
    audience: 'both',
    aiMetadata: {
        description:
            'List all active scheduler tasks in the connected 0CodeKit account, each with its task_id, webhook URL, next run time and data, plus the total count. Takes no input. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {},
    outputSchema: zeroCodeKitCodeUrlOutputSchemas.listSchedulers,
    async run({ auth }) {
        const tasks = await zeroCodeKitScheduler.listTasks(auth.secret_text);
        return {
            count: tasks.length,
            schedulers: tasks.map(zeroCodeKitScheduler.toTask),
        };
    },
});

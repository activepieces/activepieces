import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { CRON, MULTIPLE_TIMES, ONE_TIME, RECURRING, zeroCodeKitScheduler } from '../../common/scheduler';
import { zeroCodeKitCodeUrlOutputSchemas } from '../../common/output-schemas/code-url';

export const createASchedulerAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'create_a_scheduler',
    classification: 'WRITE',
    displayName: 'Create a Scheduler',
    description: 'Have 0CodeKit call a webhook with your data once, at set times, on a cron schedule, or every n hours, days, weeks or months.',
    audience: 'both',
    aiMetadata: {
        description:
            'Create a 0CodeKit scheduler task that POSTs the given JSON data to a webhook URL on a schedule: once, at a list of dates, by cron expression, or every n periods. Returns the task_id needed to delete it later. Each call creates a new task, so retries create duplicates.',
        idempotent: false,
    },
    props: {
        sendToWebhook: Property.ShortText({
            displayName: 'Webhook URL',
            description: 'The URL 0CodeKit calls on every run, such as a Catch Webhook URL.',
            required: true,
            placeholder: 'https://example.com/webhook',
        }),
        data: Property.Json({
            displayName: 'Data',
            description: 'The JSON data sent to the webhook on every run.',
            required: false,
            defaultValue: {},
        }),
        intervalType: Property.StaticDropdown({
            displayName: 'Schedule Type',
            description: 'How often the webhook is called. It sets the Schedule format.',
            required: true,
            defaultValue: ONE_TIME,
            options: {
                options: [
                    { label: 'Once', value: ONE_TIME },
                    { label: 'At several specific dates', value: MULTIPLE_TIMES },
                    { label: 'Cron expression', value: CRON },
                    { label: 'Every n hours, days, weeks or months', value: RECURRING },
                ],
            },
        }),
        scheduleFormats: Property.MarkDown({
            value: `**Schedule format** for each Schedule Type:
- **Once**: an ISO 8601 date or Unix timestamp, for example \`2026-12-31T09:00:00Z\`.
- **At several specific dates**: ISO 8601 dates or Unix timestamps separated by commas.
- **Cron expression**: a cron string, for example \`0 9 * * 1\` for every Monday at 09:00.
- **Every n hours, days, weeks or months**: \`period;n\`, for example \`days;2\`.`,
        }),
        schedule: Property.ShortText({
            displayName: 'Schedule',
            description: 'When to run, in the format shown above for the Schedule Type.',
            required: true,
            placeholder: '2026-12-31T09:00:00Z',
        }),
        endDate: Property.DateTime({
            displayName: 'End Date',
            description: 'The last date the scheduler runs. Leave empty to keep it running.',
            required: false,
        }),
    },
    outputSchema: zeroCodeKitCodeUrlOutputSchemas.createScheduler,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<CreateTaskResponse>({
            apiKey: auth.secret_text,
            path: '/operator/scheduler/add',
            body: {
                sendToWebhook: propsValue.sendToWebhook.trim(),
                data: zeroCodeKitScheduler.stringifyData(propsValue.data),
                intervalType: Number(propsValue.intervalType),
                intervalOptions: zeroCodeKitScheduler.parseSchedule({
                    intervalType: propsValue.intervalType,
                    schedule: propsValue.schedule,
                }),
                endDate: propsValue.endDate,
            },
        });
        return {
            task_id: response.taskId,
            next_execution: response.nextExecution,
            end_date: response.endDate ?? null,
        };
    },
});

type CreateTaskResponse = {
    taskId: string;
    nextExecution: string;
    endDate?: string;
};

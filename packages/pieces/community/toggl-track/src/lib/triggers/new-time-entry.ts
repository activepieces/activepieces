import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

const pollingStoreKey = 'toggl_new_time_entry_trigger';

type TimeEntry = {
    id: number;
    start: string;
    workspace_id?: number;
    project_id?: number;
    task_id?: number;
    [key: string]: unknown;
}

export const newTimeEntry = createTrigger({
    auth: togglTrackAuth,
    name: 'new_time_entry',
    displayName: 'New Time Entry',
    description: 'Fires when a new time entry is added.',
    props: {
        workspace_id: togglCommon.workspace_id,
        project_id: togglCommon.optional_project_id,
        task_id: togglCommon.optional_task_id,
    },
    sampleData: {
        "id": 1234567890,
        "workspace_id": 987654,
        "project_id": 123987456,
        "task_id": 789123456,
        "billable": false,
        "start": "2025-08-29T11:00:00Z",
        "stop": "2025-08-29T11:30:00Z",
        "duration": 1800,
        "description": "Weekly team meeting",
        "tags": ["meeting", "internal"],
        "at": "2025-08-29T11:30:00+00:00"
    },
    type: TriggerStrategy.POLLING,

    async onEnable(context) {
        // Use a timestamp-based polling strategy for time entries
        const lastPoll = Math.floor(Date.now() / 1000);
        await context.store.put(pollingStoreKey, { lastPoll });
    },

    async onDisable(context) {
        await context.store.delete(pollingStoreKey);
    },

    async run(context) {
        const { workspace_id, project_id, task_id } = context.propsValue;
        const { lastPoll } = await context.store.get<{ lastPoll: number }>(pollingStoreKey) ?? { lastPoll: 0 };
        const newPollTimestamp = Math.floor(Date.now() / 1000);

        const queryParams: QueryParams = { since: lastPoll.toString() };

        const response = await httpClient.sendRequest<TimeEntry[]>({
            method: HttpMethod.GET,
            url: `https://api.track.toggl.com/api/v9/me/time_entries`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${Buffer.from(`${context.auth}:api_token`).toString('base64')}`,
            },
            queryParams: queryParams,
        });

        const timeEntries = response.body || [];

        // Filter for truly new entries created since the last poll
        let newEntries = timeEntries.filter(entry => 
            Math.floor(new Date(entry.start).getTime() / 1000) > lastPoll
        );

        // Apply optional client-side filters
        if (workspace_id) {
            newEntries = newEntries.filter(entry => entry.workspace_id === workspace_id);
        }
        if (project_id) {
            newEntries = newEntries.filter(entry => entry.project_id === project_id);
        }
        if (task_id) {
            newEntries = newEntries.filter(entry => entry.task_id === task_id);
        }

        // Update the store with the new poll time for the next run
        await context.store.put(pollingStoreKey, { lastPoll: newPollTimestamp });
        
        return newEntries;
    },
});
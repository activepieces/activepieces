import { OAuth2PropertyValue, Property, StoreScope } from "@activepieces/pieces-framework";
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";
import { getTaskListsDropdown, MSGraphBaseTask } from "../common";
import { microsoftToDoAuth } from "../../index";

// Interface for the delta response for tasks (can be shared if identical to new_task_created)
interface MSGraphTasksDeltaResponse {
    '@odata.context'?: string;
    '@odata.nextLink'?: string;
    '@odata.deltaLink'?: string;
    value: (MSGraphBaseTask & { status?: string; completedDateTime?: string; '@removed'?: { reason: string } })[];
}

const polling: Polling<OAuth2PropertyValue, { task_list_id: string }> = {
    strategy: DedupeStrategy.LAST_ITEM, // Deduplicates based on the task.id
    items: async ({ auth, propsValue, store }) => {
        const taskListId = propsValue.task_list_id;
        // Use a unique store key for this trigger's deltaLink
        const deltaLinkStoreKey = `task_completed_deltaLink_${taskListId}`;
        const deltaLink = await store.get<string>(deltaLinkStoreKey, StoreScope.FLOW);

        // For the initial delta query, include $select for relevant fields
        const selectFields = "id,title,status,completedDateTime";
        const initialUrl = `https://graph.microsoft.com/v1.0/me/todo/lists/${taskListId}/tasks/delta?$select=${selectFields}`;
        const requestUrl = deltaLink || initialUrl;

        const response = await httpClient.sendRequest<MSGraphTasksDeltaResponse>({
            method: HttpMethod.GET,
            url: requestUrl,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.access_token,
            },
        });

        if (response.status !== 200 || !response.body) {
            console.error("Error fetching delta for completed tasks or empty body:", response);
            if (response.status === 410 && deltaLink) { // Delta link expired
                await store.delete(deltaLinkStoreKey, StoreScope.FLOW);
            }
            return [];
        }

        const newDeltaLink = response.body["@odata.deltaLink"] || response.body["@odata.nextLink"];
        if (newDeltaLink) {
            await store.put<string>(deltaLinkStoreKey, newDeltaLink, StoreScope.FLOW);
        }

        const completedTasks = response.body.value
            .filter(task => !task["@removed"] && task.status === 'completed');

        return completedTasks.map(task => ({
            id: task.id, // DedupeStrategy.LAST_ITEM will use this ID
            data: task,   // The full task object (or selected fields)
        }));
    }
};

export const taskCompletedTrigger = createTrigger({
    name: 'task_completed',
    displayName: 'Task Completed',
    description: 'Triggers when a task is marked as completed in a selected Microsoft To Do list.',
    auth: microsoftToDoAuth,
    props: {
        task_list_id: Property.Dropdown({
            displayName: 'Task List',
            description: 'The task list to monitor for completed tasks.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!(auth as OAuth2PropertyValue)?.access_token) {
                    return { disabled: true, placeholder: 'Connect your account first', options: [] };
                }
                return await getTaskListsDropdown(auth as OAuth2PropertyValue);
            }
        }),
    },
    type: TriggerStrategy.POLLING,
    async onEnable(context) {
        await pollingHelper.onEnable(polling, context);
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, context);
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
    async test(context) {
        // Test could fetch a few recently completed tasks if possible, or just use current delta logic
        return await pollingHelper.test(polling, context);
    },
    sampleData: { // Example of what a completed task might look like
        "id": "AAMkAGUzYmZmCCC=",
        "title": "Sample Completed Task",
        "status": "completed",
        "completedDateTime": "2023-10-27T10:00:00Z",
    }
});

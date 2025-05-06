import { OAuth2PropertyValue, Property, StoreScope } from "@activepieces/pieces-framework";
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";
import { getTaskListsDropdown, MSGraphBaseTask } from "../common";
import { microsoftToDoAuth } from "../../index";

// Extend MSGraphBaseTask to include fields relevant for an "updated" task
interface MSGraphTodoTaskForUpdate extends MSGraphBaseTask {
    status?: string;
    dueDateTime?: { dateTime: string; timeZone: string };
    lastModifiedDateTime?: string;
    // Add any other fields that signify an update or are useful in the payload
}

interface MSGraphTasksDeltaResponse {
    '@odata.context'?: string;
    '@odata.nextLink'?: string;
    '@odata.deltaLink'?: string;
    value: (MSGraphTodoTaskForUpdate & { '@removed'?: { reason: string } })[];
}

const polling: Polling<OAuth2PropertyValue, { task_list_id: string }> = {
    strategy: DedupeStrategy.LAST_ITEM, // Deduplicates based on the task.id
    items: async ({ auth, propsValue, store }) => {
        const taskListId = propsValue.task_list_id;
        const deltaLinkStoreKey = `task_updated_deltaLink_${taskListId}`;
        const deltaLink = await store.get<string>(deltaLinkStoreKey, StoreScope.FLOW);

        // For the initial delta query, select fields relevant to an update
        const selectFields = "id,title,status,dueDateTime,lastModifiedDateTime,createdDateTime,body"; // Add other fields as needed
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
            console.error("Error fetching delta for updated tasks or empty body:", response);
            if (response.status === 410 && deltaLink) {
                await store.delete(deltaLinkStoreKey, StoreScope.FLOW);
            }
            return [];
        }

        const newDeltaLink = response.body["@odata.deltaLink"] || response.body["@odata.nextLink"];
        if (newDeltaLink) {
            await store.put<string>(deltaLinkStoreKey, newDeltaLink, StoreScope.FLOW);
        }

        // All non-removed items from delta are considered "updated" states (either new or modified)
        const updatedTasks = response.body.value.filter(task => !task["@removed"]);

        // If we wanted to be more strict and only get "updates" not "creations":
        // One way (simplified) could be to check if createdDateTime is significantly older than lastModifiedDateTime
        // or if the item was seen in a previous (non-initial) deltaLink state.
        // However, for delta, any item appearing means its state has changed relative to the last sync point.
        // The LAST_ITEM deduplication on task.id ensures that we process each distinct task change once.

        return updatedTasks.map(task => ({
            id: task.id,
            data: task,
        }));
    }
};

export const taskUpdatedTrigger = createTrigger({
    name: 'task_updated',
    displayName: 'Task Updated',
    description: 'Triggers when a task is created or updated in a selected Microsoft To Do list.',
    auth: microsoftToDoAuth,
    props: {
        task_list_id: Property.Dropdown({
            displayName: 'Task List',
            description: 'The task list to monitor for updated tasks.',
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
    async onEnable(context) { await pollingHelper.onEnable(polling, context); },
    async onDisable(context) { await pollingHelper.onDisable(polling, context); },
    async run(context) { return await pollingHelper.poll(polling, context); },
    async test(context) { return await pollingHelper.test(polling, context); },
    sampleData: {
        "id": "AAMkAGUzYmZmDDD=",
        "title": "Updated Task Title",
        "status": "inProgress",
        "dueDateTime": { "dateTime": "2023-11-15T10:00:00Z", "timeZone": "UTC" },
        "lastModifiedDateTime": "2023-10-28T12:00:00Z"
    }
});

import { OAuth2PropertyValue, Property, StoreScope } from "@activepieces/pieces-framework";
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";
import { getTaskListsDropdown, MSGraphBaseTask } from "../common";
import { microsoftToDoAuth } from "../../index";

// Interface for the delta response for tasks
interface MSGraphTasksDeltaResponse {
    '@odata.context'?: string;
    '@odata.nextLink'?: string;
    '@odata.deltaLink'?: string;
    value: (MSGraphBaseTask & { '@removed'?: { reason: string } })[];
}

const polling: Polling<OAuth2PropertyValue, { task_list_id: string }> = {
    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({ auth, propsValue, store, lastItemId }) => {
        const taskListId = propsValue.task_list_id;
        const deltaLink = await store.get<string>(`deltaLink_${taskListId}`, StoreScope.FLOW);

        const requestUrl = deltaLink || `https://graph.microsoft.com/v1.0/me/todo/lists/${taskListId}/tasks/delta`;

        const response = await httpClient.sendRequest<MSGraphTasksDeltaResponse>({
            method: HttpMethod.GET,
            url: requestUrl,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.access_token,
            },
        });

        if (response.status !== 200 || !response.body) {
            // Handle error, maybe return empty array or throw
            // If deltaLink is invalid (e.g. expired), MS Graph might return 410 Gone
            // In that case, we might need to reset by fetching a new initial deltaLink
            console.error("Error fetching delta tasks or empty response body:", response);
            if (response.status === 410 && deltaLink) { // Delta link expired or invalid
                await store.delete(`deltaLink_${taskListId}`, StoreScope.FLOW);
                // Potentially trigger a re-fetch from scratch in the next run, or return empty and let it retry.
            }
            return [];
        }

        const newDeltaLink = response.body["@odata.deltaLink"] || response.body["@odata.nextLink"];
        if (newDeltaLink) {
            await store.put<string>(`deltaLink_${taskListId}`, newDeltaLink, StoreScope.FLOW);
        }

        const newTasks = response.body.value
            .filter(task => !task["@removed"]); // Filter out deleted tasks
            // For "New Task Created", if this is NOT the first run (i.e., deltaLink was used),
            // all non-removed items are considered new or updated since the last delta state.
            // If it IS the first run (no deltaLink), all non-removed items are effectively "new" to the trigger.
            // The LAST_ITEM strategy with task ID should handle deduplication of already processed tasks.

        return newTasks.map(task => ({
            id: task.id, // For DedupeStrategy.LAST_ITEM
            data: task,
        }));
    }
};

export const newTaskCreatedTrigger = createTrigger({
    name: 'new_task_created',
    displayName: 'New Task Created',
    description: 'Triggers when a new task is created in a selected Microsoft To Do list.',
    auth: microsoftToDoAuth,
    props: {
        task_list_id: Property.Dropdown({
            displayName: 'Task List',
            description: 'The task list to monitor for new tasks.',
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
        // When the trigger is enabled, we might want to clear any old deltaLink
        // to ensure we start fresh, or just let the items method handle it.
        // For now, let pollingHelper manage the store for lastItemId if LAST_ITEM strategy uses it.
        // If deltaLink is flow-scoped, it persists. Consider if project-scoped is better.
        // await context.store.delete(`deltaLink_${context.propsValue.task_list_id}`, StoreScope.FLOW);
        await pollingHelper.onEnable(polling, context);
    },
    async onDisable(context) {
        // Optionally clear the deltaLink from the store when the trigger is disabled
        // await context.store.delete(`deltaLink_${context.propsValue.task_list_id}`, StoreScope.FLOW);
        await pollingHelper.onDisable(polling, context);
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
    async test(context) {
        // Test might fetch a few items without persisting deltaLink, or a snapshot
        return await pollingHelper.test(polling, context);
    },
    sampleData: { // Example of what a new task might look like
        "id": "AAMkAGUzYmZmAAA=",
        "title": "Sample New Task",
        "status": "notStarted",
    }
});

import { Property, createAction, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";
import { getTaskListsDropdown, getTasksInListDropdown } from "../common";
import { microsoftToDoAuth } from "../../index";

export const updateTaskAction = createAction({
    auth:microsoftToDoAuth,
    name: 'update_task',
    displayName: 'Update Task',
    description: 'Update an existing task in Microsoft To Do.',
    props: {
        task_list_id: Property.Dropdown({
            displayName: 'Task List',
            description: 'The task list containing the task to update.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!(auth as OAuth2PropertyValue)?.access_token) {
                    return { disabled: true, placeholder: 'Connect your account first', options: [] };
                }
                return await getTaskListsDropdown(auth as OAuth2PropertyValue);
            }
        }),
        task_id: Property.Dropdown({
            displayName: 'Task',
            description: 'The task to update.',
            required: true,
            refreshers: ['task_list_id'],
            options: async ({ auth, task_list_id }) => {
                const authValue = auth as OAuth2PropertyValue;
                if (!authValue?.access_token || !task_list_id) {
                    return {
                        disabled: true,
                        placeholder: !authValue?.access_token ? 'Connect your account first' : 'Select a task list first',
                        options: []
                    };
                }
                return await getTasksInListDropdown(authValue, task_list_id as string);
            }
        }),
        title: Property.ShortText({
            displayName: 'New Title',
            description: 'The new title for the task. Leave blank to keep current title.',
            required: false,
        }),
        body_content: Property.LongText({
            displayName: 'New Body Content',
            description: 'The new body or notes for the task. Leave blank to keep current content.',
            required: false,
        }),
        importance: Property.StaticDropdown({
            displayName: 'New Importance',
            description: 'The new importance of the task. Leave blank to keep current importance.',
            required: false,
            options: {
                options: [
                    { label: 'Low', value: 'low' },
                    { label: 'Normal', value: 'normal' },
                    { label: 'High', value: 'high' },
                ]
            }
        }),
        status: Property.StaticDropdown({
            displayName: 'New Status',
            description: 'The new status of the task. Leave blank to keep current status.',
            required: false,
            options: {
                options: [
                    { label: 'Not Started', value: 'notStarted' },
                    { label: 'In Progress', value: 'inProgress' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Waiting On Others', value: 'waitingOnOthers' },
                    { label: 'Deferred', value: 'deferred' },
                ]
            },
        }),
        due_date_time: Property.DateTime({
            displayName: 'New Due Date Time',
            description: 'The new date and time the task is due. Clear to remove due date.',
            required: false,
        }),
        reminder_date_time: Property.DateTime({
            displayName: 'New Reminder Date Time',
            description: 'The new date and time for a reminder. Clear to remove reminder.',
            required: false,
        }),
        start_date_time: Property.DateTime({
            displayName: 'New Start Date Time',
            description: 'The new date and time the task is scheduled to start. Clear to remove start date.',
            required: false,
        }),
        categories: Property.ShortText({
            displayName: 'New Categories',
            description: 'Comma-separated categories. Leave blank to keep current categories. Provide empty string to clear all.',
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const {
            task_list_id,
            task_id,
            title,
            body_content,
            importance,
            status,
            due_date_time,
            reminder_date_time,
            start_date_time,
            categories
        } = propsValue;

        const oauthAuth = auth as OAuth2PropertyValue;
        const requestBody: any = {};

        if (title !== undefined && title !== null) requestBody.title = title;
        if (body_content !== undefined && body_content !== null) requestBody.body = { content: body_content, contentType: 'text' }; // API supports HTML too, but text is safer default.
        if (importance) requestBody.importance = importance;
        if (status) requestBody.status = status;

        // For nullable date fields, we might need to send null to clear them if user clears the input.
        // The Property.DateTime might return an empty string if cleared by user.
        // Microsoft Graph API expects null for clearing, or the dateTimeTimeZone object for setting.

        if (due_date_time) requestBody.dueDateTime = { dateTime: due_date_time, timeZone: 'UTC' };
        else if (due_date_time === '' || due_date_time === null) requestBody.dueDateTime = null;

        if (reminder_date_time) {
            requestBody.reminderDateTime = { dateTime: reminder_date_time, timeZone: 'UTC' };
            requestBody.isReminderOn = true;
        }
        else if (reminder_date_time === '' || reminder_date_time === null) {
            requestBody.reminderDateTime = null;
            requestBody.isReminderOn = false; // Explicitly turn off reminder if cleared
        }

        if (start_date_time) requestBody.startDateTime = { dateTime: start_date_time, timeZone: 'UTC' };
        else if (start_date_time === '' || start_date_time === null) requestBody.startDateTime = null;

        if (categories !== undefined && categories !== null) {
            if (categories === '') {
                requestBody.categories = []; // Send empty array to clear categories
            } else {
                requestBody.categories = categories.split(',').map(c => c.trim()).filter(c => c.length > 0);
            }
        }

        // Only send request if there's something to update
        if (Object.keys(requestBody).length === 0) {
            // Optionally return the existing task or a message, or fetch and return task if ID is present
            // For now, just return a message or do nothing if nothing to update.
            // However, a PATCH with empty body might be treated as bad request by some APIs.
            // Microsoft Graph usually ignores fields not present, so an empty body PATCH might be a no-op.
            // Best to ensure at least one field is being modified or return early.
            // Let's assume for now the user intends a no-op if all update fields are blank,
            // but this might need a more specific behavior (e.g. fetch current task data).
            // For safety, if requestBody is empty, we could fetch the task and return it.
            // For now, let's proceed with the PATCH, it should be a no-op by MS Graph if body is empty.
        }

        const response = await httpClient.sendRequest<any>({
            method: HttpMethod.PATCH,
            url: `https://graph.microsoft.com/v1.0/me/todo/lists/${task_list_id}/tasks/${task_id}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: oauthAuth.access_token,
            },
            body: requestBody,
        });

        return response.body;
    }
});

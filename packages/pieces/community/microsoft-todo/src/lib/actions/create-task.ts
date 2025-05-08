import { Property, createAction, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";
import { getTaskListsDropdown } from "../common";
import { microsoftToDoAuth } from "../../index";

export const createTask = createAction({
    auth:microsoftToDoAuth,
    name: 'create_task',
    displayName: 'Create Task',
    description: 'Create a new task in Microsoft To Do.',
    props: {
        task_list_id: Property.Dropdown({
            displayName: 'Task List',
            description: 'The task list to create the task in.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!(auth as OAuth2PropertyValue)?.access_token) {
                    return {
                        disabled: true,
                        placeholder: 'Connect your account first',
                        options: [],
                    };
                }
                return await getTaskListsDropdown(auth as OAuth2PropertyValue);
            }
        }),
        title: Property.ShortText({
            displayName: 'Title',
            description: 'The title of the task.',
            required: true,
        }),
        body_content: Property.LongText({
            displayName: 'Body Content',
            description: 'The body or notes for the task.',
            required: false,
        }),
        importance: Property.StaticDropdown({
            displayName: 'Importance',
            description: 'The importance of the task.',
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
            displayName: 'Status',
            description: 'The status of the task.',
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
            defaultValue: 'notStarted',
        }),
        due_date_time: Property.DateTime({
            displayName: 'Due Date Time',
            description: 'The date and time the task is due.',
            required: false,
        }),
        reminder_date_time: Property.DateTime({
            displayName: 'Reminder Date Time',
            description: 'The date and time for a reminder.',
            required: false,
        }),
        start_date_time: Property.DateTime({
            displayName: 'Start Date Time',
            description: 'The date and time the task is scheduled to start.',
            required: false,
        }),
        categories: Property.ShortText({
            displayName: 'Categories',
            description: 'Comma-separated categories for the task (e.g., Work, Personal).',
            required: false,
        }),
        linked_resource_web_url: Property.ShortText({
            displayName: 'Linked Resource Web URL',
            description: 'The URL of an external resource linked to the task.',
            required: false,
        }),
        linked_resource_application_name: Property.ShortText({
            displayName: 'Linked Resource Application Name',
            description: 'The application name of the linked resource.',
            required: false,
        }),
        linked_resource_display_name: Property.ShortText({
            displayName: 'Linked Resource Display Name',
            description: 'The display name of the linked resource.',
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const {
            task_list_id,
            title,
            body_content,
            importance,
            status,
            due_date_time,
            reminder_date_time,
            start_date_time,
            categories,
            linked_resource_web_url,
            linked_resource_application_name,
            linked_resource_display_name
        } = propsValue;

        const oauthAuth = auth as OAuth2PropertyValue;

        const requestBody: any = { title };

        if (body_content) requestBody.body = { content: body_content, contentType: 'text' };
        if (importance) requestBody.importance = importance;
        if (status) requestBody.status = status;
        if (due_date_time) requestBody.dueDateTime = { dateTime: due_date_time, timeZone: 'UTC' };
        if (reminder_date_time) {
            requestBody.reminderDateTime = { dateTime: reminder_date_time, timeZone: 'UTC' };
            requestBody.isReminderOn = true;
        }
        if (start_date_time) requestBody.startDateTime = { dateTime: start_date_time, timeZone: 'UTC' };
        if (categories) requestBody.categories = categories.split(',').map(c => c.trim()).filter(c => c.length > 0);

        const linkedResources = [];
        if (linked_resource_web_url || linked_resource_application_name || linked_resource_display_name) {
            const linkedResource: any = {};
            if (linked_resource_web_url) linkedResource.webUrl = linked_resource_web_url;
            if (linked_resource_application_name) linkedResource.applicationName = linked_resource_application_name;
            if (linked_resource_display_name) linkedResource.displayName = linked_resource_display_name;
            linkedResources.push(linkedResource);
        }
        if (linkedResources.length > 0) requestBody.linkedResources = linkedResources;

        const response = await httpClient.sendRequest<{
            id: string;
            title: string;
        }>({
            method: HttpMethod.POST,
            url: `https://graph.microsoft.com/v1.0/me/todo/lists/${task_list_id}/tasks`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: oauthAuth.access_token,
            },
            body: requestBody,
        });

        return response.body;
    }
});

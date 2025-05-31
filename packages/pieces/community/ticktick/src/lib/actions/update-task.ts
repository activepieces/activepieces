import { createAction, Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType, HttpRequest } from "@activepieces/pieces-common";
import { ChecklistItem, TICKTICK_PRIORITY_HIGH, TICKTICK_PRIORITY_LOW, TICKTICK_PRIORITY_MEDIUM, TICKTICK_PRIORITY_NONE, fetchAllProjects } from "../common";
import { ticktickAuth } from "../../index";

export const updateTask = createAction({
    auth: ticktickAuth,
    name: 'update_task',
    displayName: 'Update Task',
    description: 'Update an existing task in TickTick',
    props: {
        taskId: Property.ShortText({
            displayName: 'Task ID',
            description: 'The ID of the task to update',
            required: true,
        }),
        projectId: Property.Dropdown({
            displayName: 'Project',
            description: 'The project the task belongs to.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) return { disabled: true, placeholder: 'Please authenticate first', options: [] };
                const projects = await fetchAllProjects(auth as OAuth2PropertyValue);
                if (projects.length === 0) return { disabled: true, placeholder: 'No projects found.', options: [] };
                return {
                    disabled: false,
                    options: projects.map(p => ({ label: p.name, value: p.id })),
                };
            }
        }),
        title: Property.ShortText({
            displayName: 'Title',
            description: 'The new title of the task',
            required: false,
        }),
        content: Property.LongText({
            displayName: 'Content',
            description: 'The new content of the task',
            required: false,
        }),
        desc: Property.LongText({
            displayName: 'Description (Checklist)',
            description: 'New description of the checklist items. Replaces existing.',
            required: false,
        }),
        isAllDay: Property.Checkbox({
            displayName: 'All Day',
            description: 'Whether the task is an all-day task',
            required: false,
        }),
        startDate: Property.DateTime({
            displayName: 'Start Date',
            description: 'New start date and time (yyyy-MM-ddTHH:mm:ssZ, e.g., 2019-11-13T03:00:00+0000)',
            required: false,
        }),
        dueDate: Property.DateTime({
            displayName: 'Due Date',
            description: 'New due date and time (yyyy-MM-ddTHH:mm:ssZ, e.g., 2019-11-14T03:00:00+0000)',
            required: false,
        }),
        timeZone: Property.ShortText({
            displayName: 'Time Zone',
            description: 'The new time zone for the task (e.g., America/Los_Angeles)',
            required: false,
        }),
        priority: Property.StaticDropdown({
            displayName: 'Priority',
            description: 'New priority of the task.',
            required: false,
            options: {
                options: [
                    { label: 'Unset (Keep Current)', value: null },
                    { label: 'None', value: TICKTICK_PRIORITY_NONE },
                    { label: 'Low', value: TICKTICK_PRIORITY_LOW },
                    { label: 'Medium', value: TICKTICK_PRIORITY_MEDIUM },
                    { label: 'High', value: TICKTICK_PRIORITY_HIGH },
                ]
            }
        }),
        reminders: Property.Array({
            displayName: 'Reminders',
            description: 'List of reminder strings (e.g., "TRIGGER:P0DT9H0M0S"). Replaces existing reminders. Send empty array to clear.',
            required: false,
            properties: {
                reminder: Property.ShortText({
                    displayName: 'Reminder String',
                    required: true
                })
            }
        }),
        repeatFlag: Property.ShortText({
            displayName: 'Repeat Flag (RRULE)',
            description: 'New recurring rule (iCalendar RRULE format, e.g., "RRULE:FREQ=DAILY;INTERVAL=1"). Replaces existing rule. Send empty string to clear.',
            required: false,
        }),
        items: Property.Json({
            displayName: 'Subtasks (Checklist Items)',
            description: 'JSON array of subtask objects. Replaces existing subtasks. See Create Task action for item structure. Send empty array to clear.',
            required: false,
        }),
    },
    async run(context) {
        const { taskId, projectId, title, content, desc, isAllDay, startDate, dueDate, timeZone, priority, reminders, repeatFlag, items } = context.propsValue;
        const authentication = context.auth as OAuth2PropertyValue;

        const taskData: any = {
            id: taskId,
            projectId: projectId as string,
        };

        if (title !== undefined) taskData.title = title;
        if (content !== undefined) taskData.content = content;
        if (desc !== undefined) taskData.desc = desc;
        if (isAllDay !== undefined) taskData.isAllDay = isAllDay;
        if (startDate !== undefined) taskData.startDate = startDate;
        if (dueDate !== undefined) taskData.dueDate = dueDate;
        if (timeZone !== undefined) taskData.timeZone = timeZone;
        if (priority !== undefined && priority !== null) taskData.priority = priority;

        if (reminders !== undefined) {
            taskData.reminders = reminders;
        }
        if (repeatFlag !== undefined) {
            taskData.repeatFlag = repeatFlag;
        }
        if (items !== undefined) {
            taskData.items = items as unknown as ChecklistItem[];
        }

        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `https://api.ticktick.com/open/v1/task/${taskId}`,
            body: taskData,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: authentication.access_token,
            },
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const response = await httpClient.sendRequest(request);
        return response.body;
    },
});

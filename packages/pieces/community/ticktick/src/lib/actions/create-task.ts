import { createAction, Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType, HttpRequest } from "@activepieces/pieces-common";
import { ChecklistItem, TICKTICK_PRIORITY_HIGH, TICKTICK_PRIORITY_LOW, TICKTICK_PRIORITY_MEDIUM, TICKTICK_PRIORITY_NONE, fetchAllProjects } from "../common";
import { ticktickAuth } from "../../index";

export const createTask = createAction({
    auth: ticktickAuth,
    name: 'create_task',
    displayName: 'Create Task',
    description: 'Create a new task in TickTick',
    props: {
        projectId: Property.Dropdown({
            displayName: 'Project',
            description: 'The project to create the task in.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please authenticate first',
                        options: [],
                    };
                }
                const projects = await fetchAllProjects(auth as OAuth2PropertyValue);
                if (projects.length === 0) {
                    return {
                        disabled: true,
                        placeholder: 'No projects found. Please create a project in TickTick first.',
                        options: [],
                    };
                }
                return {
                    disabled: false,
                    options: projects.map(project => {
                        return {
                            label: project.name,
                            value: project.id,
                        };
                    }),
                };
            }
        }),
        title: Property.ShortText({
            displayName: 'Title',
            description: 'The title of the task',
            required: true,
        }),
        content: Property.LongText({
            displayName: 'Content',
            description: 'The content of the task',
            required: false,
        }),
        desc: Property.LongText({
            displayName: 'Description (Checklist)',
            description: 'Description of the checklist, often used with subtasks (items)',
            required: false,
        }),
        isAllDay: Property.Checkbox({
            displayName: 'All Day',
            description: 'Whether the task is an all-day task',
            required: false,
        }),
        startDate: Property.DateTime({
            displayName: 'Start Date',
            description: 'Start date and time (yyyy-MM-ddTHH:mm:ssZ, e.g., 2019-11-13T03:00:00+0000)',
            required: false,
        }),
        dueDate: Property.DateTime({
            displayName: 'Due Date',
            description: 'Due date and time (yyyy-MM-ddTHH:mm:ssZ, e.g., 2019-11-14T03:00:00+0000)',
            required: false,
        }),
        timeZone: Property.ShortText({
            displayName: 'Time Zone',
            description: 'The time zone for the task (e.g., America/Los_Angeles)',
            required: false,
        }),
        priority: Property.StaticDropdown({
            displayName: 'Priority',
            description: 'Priority of the task.',
            required: false,
            options: {
                options: [
                    { label: 'None', value: TICKTICK_PRIORITY_NONE },
                    { label: 'Low', value: TICKTICK_PRIORITY_LOW },
                    { label: 'Medium', value: TICKTICK_PRIORITY_MEDIUM },
                    { label: 'High', value: TICKTICK_PRIORITY_HIGH },
                ]
            }
        }),
        reminders: Property.Array({
            displayName: 'Reminders',
            description: 'List of reminder strings (e.g., "TRIGGER:P0DT9H0M0S"). Refer to TickTick API for format.',
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
            description: 'Recurring rule for the task in iCalendar RRULE format (e.g., "RRULE:FREQ=DAILY;INTERVAL=1")',
            required: false,
        }),
        items: Property.Json({
            displayName: 'Subtasks (Checklist Items)',
            description: 'JSON array of subtask objects. Fields: title (string, required), startDate (datetime string), isAllDay (boolean), sortOrder (integer), timeZone (string), status (0 for Incomplete, 1 for Completed), completedTime (datetime string). Example: [{"title": "Subtask 1"}, {"title": "Subtask 2", "status": 1}]',
            required: false,
            defaultValue: [],
        }),
    },
    async run(context) {
        const { projectId, title, content, desc, isAllDay, startDate, dueDate, timeZone, priority, reminders, repeatFlag, items } = context.propsValue;
        const authentication = context.auth as OAuth2PropertyValue;

        const taskData: any = {
            title,
            projectId: projectId as string,
        };

        if (content !== undefined) taskData.content = content;
        if (desc !== undefined) taskData.desc = desc;
        if (isAllDay !== undefined) taskData.isAllDay = isAllDay;
        if (startDate) taskData.startDate = startDate;
        if (dueDate) taskData.dueDate = dueDate;
        if (timeZone) taskData.timeZone = timeZone;
        if (priority !== undefined) taskData.priority = priority;
        if (reminders && Array.isArray(reminders) && reminders.length > 0) {
            taskData.reminders = reminders;
        }
        if (repeatFlag) taskData.repeatFlag = repeatFlag;
        if (items && Array.isArray(items)) {
            taskData.items = items as unknown as ChecklistItem[];
        }

        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `https://api.ticktick.com/open/v1/task`,
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

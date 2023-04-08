import { Property, OAuth2PropertyValue } from "@activepieces/framework";
import { HttpRequest, HttpMethod, AuthenticationType, httpClient } from "@activepieces/pieces-common";

export enum TaskStatus {
    NEEDS_ACTION = 'needsAction',
    COMPLETED = 'completed'
}

/**
 * @see https://developers.google.com/tasks/reference/rest/v1/tasklists/list#response-body
 */
export type TasksListResponse = {
    "kind": string,
    "etag": string,
    "nextPageToken": string,
    "items": TasksList[]
  };

  /**
   * @see https://developers.google.com/tasks/reference/rest/v1/tasklists#resource:-tasklist
   */
export type TasksList = {
    kind: string,
    id: string,
    etag: string,
    title: string,
    updated: string,
    selfLink: string,
};

/**
 * @see https://developers.google.com/tasks/reference/rest/v1/tasks#resource:-task
 */
export type Task = {
    kind: "tasks#task",
    title: string,
    status: TaskStatus,
    notes?: string,

    /**
     * *Optional* RFC 3339 timestamp of due date of the task
     */
    due?: string,

    /**
     * *Optional* RFC 3339 timestamp of completion.  
     * Filled automatically if `status === 'completed'`
     */
    completed?: string,
};

export const googleTasksCommon = {
    baseUrl: `https://tasks.googleapis.com`,
    authentication: Property.OAuth2({
        description: "",
        displayName: 'Authentication',
        authUrl: "https://accounts.google.com/o/oauth2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        required: true,
        scope: ["https://www.googleapis.com/auth/tasks"]
    }),

    /**
     * @property Target task list ID where the new task will be created
     */
    tasksList: Property.Dropdown<string>({
        displayName: 'Tasks List',
        refreshers: ['authentication'],
        required: true,
        options: async (propsValue) => {
            if (!propsValue['authentication']) {
                return {
                    disabled: true,
                    placeholder: "Please connect your account first",
                    options: [],
                };
            }

            const authProp: OAuth2PropertyValue = propsValue['authentication'] as OAuth2PropertyValue;
            const tasksLists = await getTasks(authProp);

            return {
                disabled: false,
                options: tasksLists.map(list => {
                    return {
                        label: list.title,
                        value: list.id,
                    };
                }),
            };
        },
    }),
    title: Property.ShortText({
        displayName: 'Title',
        required: true,
    }),
    notes: Property.LongText({
        displayName: 'Notes',
        required: false,
    }),
    completed: Property.Checkbox({
        displayName: 'Completed',
        description: 'Mark task as completed',
        required: false,
    }),
};

export async function getTasks(
    authProp: OAuth2PropertyValue
): Promise<TasksList[]> {
    // docs: https://developers.google.com/tasks/reference/rest/v1/tasklists/list
    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${googleTasksCommon.baseUrl}/tasks/v1/users/@me/lists`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: authProp.access_token,
        },
    };
    const response = await httpClient.sendRequest<TasksListResponse>(request);
    return response.body.items;
}

export async function createTask(authProp: OAuth2PropertyValue, taskListId: string, task: Task) {
    const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${googleTasksCommon.baseUrl}/tasks/v1/lists/${taskListId}/tasks`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: authProp.access_token,
        },
        body: task,
    };

    return httpClient.sendRequest(request);
}

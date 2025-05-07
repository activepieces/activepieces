import { Property, createAction, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType, QueryParams } from "@activepieces/pieces-common";
import { getTaskListsDropdown, MSGraphTaskList, MSGraphBaseTask } from "../common";

// Interface for the response when fetching tasks from a list
interface FindTasksResponse {
    value: MSGraphBaseTask[];
}

// Interface for the response when fetching all task lists
interface AllTaskListsResponse {
    value: MSGraphTaskList[];
}

export const findTaskByTitleAction = createAction({
    name: 'find_task_by_title',
    displayName: 'Find Task by Title',
    description: 'Find tasks by title. Can search globally or within a specific task list (searching globally may be slow).',
    props: {
        title: Property.ShortText({
            displayName: 'Task Title',
            description: 'The title (or partial title) of the task to find.',
            required: true,
        }),
        task_list_id: Property.Dropdown({
            displayName: 'Task List (Optional)',
            description: 'Select a specific task list to search within. If not selected, searches all lists.',
            required: false,
            refreshers: [],
            options: async ({ auth }) => {
                if (!(auth as OAuth2PropertyValue)?.access_token) {
                    return { disabled: true, placeholder: 'Connect your account first', options: [] };
                }
                return await getTaskListsDropdown(auth as OAuth2PropertyValue);
            }
        }),
        match_type: Property.StaticDropdown({
            displayName: 'Match Type',
            description: 'How to match the task title.',
            required: false,
            defaultValue: 'contains',
            options: {
                options: [
                    { label: 'Contains', value: 'contains' },
                    { label: 'Starts With', value: 'startsWith' },
                    { label: 'Exact Match', value: 'exact' },
                ]
            }
        })
    },
    async run(context) {
        const { auth, propsValue } = context;
        const oauthAuth = auth as OAuth2PropertyValue;
        const { title, task_list_id, match_type } = propsValue;

        let titleFilterString = "";
        switch (match_type) {
            case 'startsWith':
                titleFilterString = `startsWith(title, '${title}')`;
                break;
            case 'exact':
                titleFilterString = `title eq '${title}'`;
                break;
            case 'contains':
            default:
                titleFilterString = `contains(title, '${title}')`;
                break;
        }

        const queryParams: QueryParams = { '$filter': titleFilterString };
        let allMatchingTasks: MSGraphBaseTask[] = [];

        if (task_list_id) {
            // Search within a specific task list
            const response = await httpClient.sendRequest<FindTasksResponse>({
                method: HttpMethod.GET,
                url: `https://graph.microsoft.com/v1.0/me/todo/lists/${task_list_id}/tasks`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: oauthAuth.access_token,
                },
                queryParams: queryParams,
            });
            if (response.body && response.body.value) {
                allMatchingTasks = response.body.value;
            }
        } else {
            // Global search: Fetch all lists, then tasks from each list
            const listsResponse = await httpClient.sendRequest<AllTaskListsResponse>({
                method: HttpMethod.GET,
                url: `https://graph.microsoft.com/v1.0/me/todo/lists`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: oauthAuth.access_token,
                },
            });

            if (listsResponse.body && listsResponse.body.value) {
                for (const list of listsResponse.body.value) {
                    try {
                        const tasksInListResponse = await httpClient.sendRequest<FindTasksResponse>({
                            method: HttpMethod.GET,
                            url: `https://graph.microsoft.com/v1.0/me/todo/lists/${list.id}/tasks`,
                            authentication: {
                                type: AuthenticationType.BEARER_TOKEN,
                                token: oauthAuth.access_token,
                            },
                            queryParams: queryParams, // Apply title filter here
                        });
                        if (tasksInListResponse.body && tasksInListResponse.body.value) {
                            allMatchingTasks.push(...tasksInListResponse.body.value);
                        }
                    } catch (e) {
                        // Log error for this specific list and continue, so one problematic list doesn't stop all search
                        console.error(`Error fetching tasks for list ${list.id} (${list.displayName}):`, e);
                    }
                }
            }
        }
        return allMatchingTasks;
    }
});

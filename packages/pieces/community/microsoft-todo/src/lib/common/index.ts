import { OAuth2PropertyValue, DropdownOption } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";

export interface MSGraphBaseTask {
    id: string;
    title?: string;
}

export interface MSGraphTaskList {
    id: string;
    displayName: string;
    isOwner?: boolean;
    isShared?: boolean;
    wellknownListName?: string;
}

interface MSGraphTaskListResponse {
    value: MSGraphTaskList[];
}

interface MSGraphTasksResponse {
    value: MSGraphBaseTask[];
}

export async function getTaskListsDropdown(auth: OAuth2PropertyValue): Promise<{
    disabled: boolean;
    options: DropdownOption<string>[];
    placeholder?: string;
}> {
    if (!auth || !auth.access_token) {
        return {
            disabled: true,
            options: [],
            placeholder: "Connect your account first",
        };
    }

    try {
        const response = await httpClient.sendRequest<MSGraphTaskListResponse>({
            method: HttpMethod.GET,
            url: "https://graph.microsoft.com/v1.0/me/todo/lists",
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.access_token,
            },
        });

        if (response.status === 200 && response.body && response.body.value) {
            const options = response.body.value.map((list) => ({
                label: list.displayName,
                value: list.id,
            }));

            if (options.length === 0) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "No task lists found. Create one in Microsoft To Do first.",
                };
            }

            return {
                disabled: false,
                options: options,
            };
        } else {
            // Handle non-200 responses or unexpected body structure
            console.error("Failed to fetch task lists", response);
            return {
                disabled: true,
                options: [],
                placeholder: "Error fetching task lists. Check connection or API permissions.",
            };
        }
    } catch (error) {
        console.error("Error in getTaskListsDropdown:", error);
        return {
            disabled: true,
            options: [],
            placeholder: "An unexpected error occurred while fetching task lists.",
        };
    }
}

export async function getTasksInListDropdown(auth: OAuth2PropertyValue, taskListId: string): Promise<{
    disabled: boolean;
    options: DropdownOption<string>[];
    placeholder?: string;
}> {
    if (!auth || !auth.access_token) {
        return { disabled: true, options: [], placeholder: "Connect your account first" };
    }
    if (!taskListId) {
        return { disabled: true, options: [], placeholder: "Task List ID is required" };
    }

    try {
        const response = await httpClient.sendRequest<MSGraphTasksResponse>({
            method: HttpMethod.GET,
            url: `https://graph.microsoft.com/v1.0/me/todo/lists/${taskListId}/tasks`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.access_token,
            },
        });

        if (response.status === 200 && response.body && response.body.value) {
            const options = response.body.value.map((task) => ({
                label: task.title || task.id,
                value: task.id,
            }));

            if (options.length === 0) {
                return { disabled: false, options: [], placeholder: "No tasks found in this list." };
            }
            return { disabled: false, options: options };
        } else {
            console.error(`Failed to fetch tasks for list ${taskListId}`, response);
            return { disabled: true, options: [], placeholder: "Error fetching tasks." };
        }
    } catch (error) {
        console.error(`Error in getTasksInListDropdown for list ${taskListId}:`, error);
        return { disabled: true, options: [], placeholder: "Error fetching tasks." };
    }
}

export const microsoftTodoCommon = {
    getTaskListsDropdown,
    getTasksInListDropdown,
};

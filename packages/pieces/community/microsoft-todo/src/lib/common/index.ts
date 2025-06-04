import { OAuth2PropertyValue, DropdownOption } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { TodoTaskList, TodoTask } from '@microsoft/microsoft-graph-types';

export async function getTaskListsDropdown(auth: OAuth2PropertyValue): Promise<{
	disabled: boolean;
	options: DropdownOption<string>[];
	placeholder?: string;
}> {
	if (!auth || !auth.access_token) {
		return {
			disabled: true,
			options: [],
			placeholder: 'Connect your account first',
		};
	}

	try {
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const options: DropdownOption<string>[] = [];
		let response: PageCollection = await client.api(`/me/todo/lists`).get();

		while (response.value.length > 0) {
			for (const list of response.value as TodoTaskList[]) {
				options.push({ label: list.displayName!, value: list.id! });
			}
			if (response['@odata.nextLink']) {
				response = await client.api(response['@odata.nextLink']).get();
			} else {
				break;
			}
		}

		return {
			disabled: false,
			options: options,
		};
	} catch (error) {
		return {
			disabled: true,
			options: [],
			placeholder: 'An unexpected error occurred while fetching task lists.',
		};
	}
}

export async function getTasksInListDropdown(
	auth: OAuth2PropertyValue,
	taskListId: string,
): Promise<{
	disabled: boolean;
	options: DropdownOption<string>[];
	placeholder?: string;
}> {
	if (!auth || !auth.access_token) {
		return { disabled: true, options: [], placeholder: 'Connect your account first' };
	}
	if (!taskListId) {
		return { disabled: true, options: [], placeholder: 'Task List ID is required' };
	}

	try {
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const options: DropdownOption<string>[] = [];

		let response: PageCollection = await client.api(`/me/todo/lists/${taskListId}/tasks`).get();
		while (response.value.length > 0) {
			for (const task of response.value as TodoTask[]) {
				if (task.id && task.title) {
					options.push({ label: task.title, value: task.id });
				}
			}
			if (response['@odata.nextLink']) {
				response = await client.api(response['@odata.nextLink']).get();
			} else {
				break;
			}
		}

		return { disabled: false, options: options };
	} catch (error) {
		return { disabled: true, options: [], placeholder: 'Error fetching tasks.' };
	}
}

export const microsoftTodoCommon = {
	getTaskListsDropdown,
	getTasksInListDropdown,
};

import { HttpMethod } from '@activepieces/pieces-common';
import { TaskadeApiError, taskadeApi } from './client';
import { taskadeNormalize } from './normalize';
import { ItemAPIResponse, Task, TaskResponse } from './types';

async function getTask({ token, projectId, taskId }: { token: string; projectId: unknown; taskId: unknown }): Promise<Task> {
	const response = await taskadeApi.request<ItemAPIResponse<TaskResponse>>({
		token,
		method: HttpMethod.GET,
		path: taskadeApi.taskPath({ projectId, taskId }),
		operation: 'get task',
	});
	return taskadeNormalize.task(response.item);
}

async function taskOrFallback({ token, projectId, taskId, item }: { token: string; projectId: unknown; taskId: unknown; item: TaskResponse | null | undefined }): Promise<Task> {
	if (item && typeof item.id === 'string' && typeof item.text === 'string' && typeof item.parentId === 'string') {
		return taskadeNormalize.task(item);
	}
	return getTask({ token, projectId, taskId });
}

async function ignoreMissingSubResource<T>({
	token,
	projectId,
	taskId,
	call,
	whenMissing,
}: {
	token: string;
	projectId: unknown;
	taskId: unknown;
	call: () => Promise<T>;
	whenMissing: T;
}): Promise<T> {
	try {
		return await call();
	} catch (error) {
		if (!isMissing(error)) {
			throw error;
		}
		await getTask({ token, projectId, taskId });
		return whenMissing;
	}
}

async function setCompletion({ token, projectId, taskId, completed }: { token: string; projectId: unknown; taskId: unknown; completed: boolean }): Promise<{ task: Task; changed: boolean }> {
	try {
		const response = await taskadeApi.request<ItemAPIResponse<TaskResponse>>({
			token,
			method: HttpMethod.POST,
			path: `${taskadeApi.taskPath({ projectId, taskId })}/${completed ? 'complete' : 'uncomplete'}`,
			operation: completed ? 'complete task' : 'reopen task',
			body: {},
		});
		return { task: await taskOrFallback({ token, projectId, taskId, item: response.item }), changed: true };
	} catch (error) {
		if (taskadeApi.statusOf(error) !== 400) {
			throw error;
		}
		const task = await getTask({ token, projectId, taskId });
		if (task.completed !== completed) {
			throw error;
		}
		return { task, changed: false };
	}
}

function isMissing(error: unknown): boolean {
	if (taskadeApi.isNotFound(error)) {
		return true;
	}
	if (!(error instanceof TaskadeApiError) || error.status !== 400) {
		return false;
	}
	const body = error.responseBody;
	const message = taskadeApi.isRecord(body) && typeof body['message'] === 'string' ? body['message'] : '';
	return /does not exist/i.test(message);
}

function validateTaskText({ value, label, singleLine }: { value: unknown; label: string; singleLine: boolean }): string {
	const text = taskadeApi.requireText({ value, label });
	if (text.length > MAX_TASK_TEXT) {
		throw new Error(`${label} is ${text.length} characters; Taskade allows at most ${MAX_TASK_TEXT}.`);
	}
	if (singleLine && /[\r\n]/.test(text)) {
		throw new Error(`${label} must be a single line. Put longer details in the task note (Set Task Note).`);
	}
	return text;
}

function contentType(format: unknown): 'text/markdown' | 'text/plain' {
	return format === 'text/plain' ? 'text/plain' : 'text/markdown';
}

export const taskadeTasks = { getTask, setCompletion, taskOrFallback, ignoreMissingSubResource, validateTaskText, contentType, MAX_TASK_TEXT: 2000 };

const MAX_TASK_TEXT = 2000;

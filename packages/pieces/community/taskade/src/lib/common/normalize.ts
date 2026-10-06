import { HttpMethod } from '@activepieces/pieces-common';
import { taskadeApi } from './client';
import { Agent, AgentResponse, Conversation, ConversationResponse, CustomField, FieldResponse, ItemAPIResponse, Project, ProjectResponse, Task, TaskResponse } from './types';

function project(raw: ProjectResponse | null | undefined): Project {
	if (!raw || typeof raw.id !== 'string') {
		throw new Error('Taskade returned no project in its response.');
	}
	return {
		id: raw.id,
		name: raw.name ?? null,
		icon: raw.icon?.value ?? null,
		completed: raw.completed === true,
		url: taskadeApi.projectUrl(raw.id),
	};
}

function task(raw: TaskResponse | null | undefined): Task {
	if (!raw || typeof raw.id !== 'string') {
		throw new Error('Taskade returned no task in its response.');
	}
	return {
		id: raw.id,
		text: raw.text ?? '',
		parentId: raw.parentId ?? null,
		completed: raw.completed === true,
		isRoot: !raw.parentId,
	};
}

function agent({ raw, includePrompts }: { raw: AgentResponse | null | undefined; includePrompts: boolean }): Agent {
	if (!raw || typeof raw.id !== 'string') {
		throw new Error('Taskade returned no agent in its response.');
	}
	const commands = (raw.data?.commands ?? []).map((command) =>
		includePrompts ? { id: command.id, name: command.name, prompt: command.prompt ?? '' } : { id: command.id, name: command.name },
	);
	return {
		id: raw.id,
		name: raw.name ?? null,
		spaceId: raw.space_id ?? null,
		description: raw.data?.description ?? null,
		knowledgeEnabled: raw.data?.knowledgeEnabled === true,
		commands,
	};
}

function conversation(raw: ConversationResponse): Conversation {
	return {
		id: raw.id,
		agentId: raw.space_agent_id ?? null,
		title: raw.title ?? null,
		status: raw.status ?? null,
	};
}

function pageOutput<T>({ items, page, limit }: { items: T[]; page: number; limit: number }): { items: T[]; page: number; nextPage: number | null; hasMore: boolean } {
	const hasMore = items.length >= limit;
	return { items, page, nextPage: hasMore ? page + 1 : null, hasMore };
}

function field(raw: FieldResponse): CustomField {
	const data = raw.data ?? {};
	const type = typeof data['type'] === 'string' ? data['type'] : null;
	const name = data['displayName'] ?? data['title'];
	const rawOptions = data['options'];
	const options = taskadeApi.isRecord(rawOptions)
		? Object.values(rawOptions)
				.filter(taskadeApi.isRecord)
				.map((option) => ({ id: String(option['id'] ?? ''), name: String(option['name'] ?? '') }))
		: [];
	return { id: raw.id, type, displayName: typeof name === 'string' ? name : null, options, data };
}

async function projectWithName({ token, item }: { token: string; item: ProjectResponse | null | undefined }): Promise<Project> {
	const normalized = project(item);
	if (normalized.name !== null) {
		return normalized;
	}
	const response = await taskadeApi.request<ItemAPIResponse<ProjectResponse>>({
		token,
		method: HttpMethod.GET,
		path: taskadeApi.projectPath(normalized.id),
		operation: 'get project',
	});
	return { ...normalized, ...project(response.item) };
}

export const taskadeNormalize = { projectWithName, project, task, agent, conversation, field, pageOutput };

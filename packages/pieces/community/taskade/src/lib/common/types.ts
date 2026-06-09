export interface ListAPIResponse<T> {
	ok: boolean;
	items: Array<T>;
}

export interface BaseResponse {
	id: string;
	name: string;
}

export type WorkspaceResponse = BaseResponse;
export type WorkspaceFolderResponse = BaseResponse;
export type ProjectResponse = BaseResponse;
export type ProjectTemplateResponse = BaseResponse;
export type AgentSpaceResponse = BaseResponse;

export interface CreateTaskParams {
	contentType: string;
	content: string;
	placement: string;
}

export interface TaskResponse {
	id: string;
	parentId: string;
	text: string;
	completed: boolean;
}

export interface CreateTaskResponse {
	ok: boolean;
	item: TaskResponse[];
}

export interface CreateTaskDateParams {
	start: {
		date: string;
		time: string;
	};
	end?: {
		date: string;
		time: string;
	};
}

export interface UpdateTaskParams {
	contentType: string;
	content: string;
}

export interface MoveTaskParams {
	target: {
		taskId: string;
		position: string;
	};
}

export interface TaskActionResponse {
	ok: boolean;
	item: TaskResponse;
}

export interface CreateProjectParams {
	folderId: string;
	contentType: string;
	content: string;
}

export interface CreateProjectFromTemplateParams {
	folderId: string;
	templateId: string;
}

export interface CreateProjectResponse {
	ok: boolean;
	item: ProjectResponse;
}

export interface AgentResponse {
	id: string;
	name: string;
	description: string;
}

export interface RunAgentParams {
	spaceId: string;
	agentId: string;
	prompt: string;
}

export interface RunAgentResponse {
	ok: boolean;
	summary: string;
}

export type ListAPIResponse<T> = {
	ok: boolean;
	items: Array<T>;
};

export type ItemAPIResponse<T> = {
	ok: boolean;
	item: T | null;
};

export type BaseResponse = {
	id: string;
	name: string;
};

export type WorkspaceResponse = BaseResponse;
export type WorkspaceFolderResponse = BaseResponse;

export type ProjectResponse = {
	id: string;
	name?: string;
	icon?: { type: string; value: string } | null;
	completed?: boolean;
};

export type TaskResponse = {
	id: string;
	parentId?: string;
	text?: string;
	completed?: boolean;
};

export type TaskPageResponse = ListAPIResponse<TaskResponse> & {
	hasMore?: boolean;
	nextCursor?: string | null;
};

export type CreateTaskResponse = {
	ok: boolean;
	item: TaskResponse[];
};

export type TaskadeDate = {
	date: string;
	time?: string | null;
	timezone?: string | null;
};

export type TaskDateResponse = {
	start: TaskadeDate;
	end?: TaskadeDate | { period: string } | null;
};

export type TaskNoteResponse = {
	type: string;
	value: string;
};

export type MemberResponse = {
	handle: string;
	displayName?: string;
};

export type FieldValueResponse = {
	fieldId: string;
	value?: unknown;
};

export type FieldResponse = {
	id: string;
	data?: Record<string, unknown>;
};

export type AgentCommandResponse = {
	id: string;
	name: string;
	prompt?: string;
	mode?: string;
};

export type AgentResponse = {
	id: string;
	name?: string;
	space_id?: string;
	data?: {
		commands?: AgentCommandResponse[];
		description?: string;
		knowledgeEnabled?: boolean;
		avatar?: unknown;
		tone?: string;
		language?: string;
	};
};

export type ConversationResponse = {
	id: string;
	space_agent_id?: string;
	status?: string;
	title?: string;
};

export type ShareLinkResponse = {
	editUrl?: string;
	viewUrl?: string;
	checkUrl?: string;
};

export type Project = {
	id: string;
	name: string | null;
	icon: string | null;
	completed: boolean;
	url: string;
};

export type Task = {
	id: string;
	text: string;
	parentId: string | null;
	completed: boolean;
	isRoot: boolean;
};

export type Agent = {
	id: string;
	name: string | null;
	spaceId: string | null;
	description: string | null;
	knowledgeEnabled: boolean;
	commands: Array<{ id: string; name: string; prompt?: string }>;
};

export type Conversation = {
	id: string;
	agentId: string | null;
	title: string | null;
	status: string | null;
};

export type CustomField = {
	id: string;
	type: string | null;
	displayName: string | null;
	options: Array<{ id: string; name: string }>;
	data: Record<string, unknown>;
};

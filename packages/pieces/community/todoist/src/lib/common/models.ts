export type TodoistProject = {
	id: string;
	name: string;
};

export type TodoistSection = {
	id: string;
	name: string;
	project_id: string;
	order: number;
};

export type TodoistCreateTaskRequest = {
	content: string;
	project_id?: string | undefined;
	description?: string | undefined;
	labels?: Array<string> | undefined;
	priority?: number | undefined;
	due_date?: string | undefined;
	section_id?: string | undefined;
};

export type TodoistUpdateTaskRequest = {
	task_id: string;
	content?: string;
	description?: string;
	labels?: Array<string>;
	priority?: number;
	due_date?: string;
};

type TodoistTaskDue = {
	string: string;
	date: string;
	is_recurring: boolean;
	datetime?: string | undefined;
	timezone?: string | undefined;
};

export type TodoistTask = {
	id: string;
	projectId: string | null;
	sectionId: string | null;
	content: string;
	description?: string | undefined;
	is_completed: boolean;
	labels: string[];
	parent_id: string | null;
	order: number;
	priority: number;
	due: TodoistTaskDue | null;
	url: string;
	comment_count: number;
	created_at: string;
	creator_id: string;
	assignee_id: string | null;
	assigner_id: string | null;
};

export type TodoistCompletedTask = {
	id: string;
	task_id: string;
	user_id: string;
	project_id: string;
	section_id: string;
	content: string;
	completed_at: string;
	note_count: number;
};

export type TodoistCompletedListResponse = {
	items: TodoistCompletedTask[];
};

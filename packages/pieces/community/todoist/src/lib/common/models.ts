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
    due_string?: string | undefined;
    due_datetime?: string | undefined;
	section_id?: string | undefined;
};

export type TodoistUpdateTaskRequest = {
	content?: string;
	description?: string;
	labels?: Array<string>;
	priority?: number;
	due_date?: string | undefined;
    due_string?: string | undefined;
    due_datetime?: string | undefined;
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
	project_id: string | null;
	section_id: string | null;
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
	user_id: string;
	project_id: string;
	section_id: string | null;
	parent_id: string | null;
	added_by_uid: string;
	assigned_by_uid: string | null;
	responsible_uid: string | null;
	completed_by_uid: string | null;
	labels: string[];
	checked: boolean;
	is_deleted: boolean;
	content: string;
	description: string;
	priority: number;
	note_count: number;
	due: TodoistTaskDue | null;
	added_at: string;
	completed_at: string;
	updated_at: string;
};

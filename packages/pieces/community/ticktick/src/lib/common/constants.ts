
// Task Statuses
export const TICKTICK_TASK_STATUS_INCOMPLETE = 0;
export const TICKTICK_TASK_STATUS_COMPLETED = 2;

// ChecklistItem (Subtask) Statuses
export const TICKTICK_SUBTASK_STATUS_INCOMPLETE = 0;
export const TICKTICK_SUBTASK_STATUS_COMPLETED = 1;

// Task Priorities
export const TICKTICK_PRIORITY_NONE = 0;
export const TICKTICK_PRIORITY_LOW = 1;
export const TICKTICK_PRIORITY_MEDIUM = 3;
export const TICKTICK_PRIORITY_HIGH = 5;

export const TICKTICK_VIEW_MODE_OPTIONS = {
	options: [
		{ label: 'List', value: 'list' },
		{ label: 'Kanban', value: 'kanban' },
		{ label: 'Timeline', value: 'timeline' },
	],
};

export const TICKTICK_PROJECT_KIND_OPTIONS = {
	options: [
		{ label: 'Task', value: 'TASK' },
		{ label: 'Note', value: 'NOTE' },
	],
};

import { Property } from '@activepieces/pieces-framework';
import { NinjaPipeRecord } from './client';
import { ninjapipeFields } from './fields';
import { ninjapipeProps } from './props';

function taskProps({ titleRequired }: { titleRequired: boolean }) {
  return {
    title: titleRequired
      ? Property.ShortText({ displayName: 'Title', required: true })
      : Property.ShortText({ displayName: 'Title', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    status: ninjapipeProps.staticDropdown({ displayName: 'Status', description: 'Task status.', values: TASK_STATUSES }),
    priority: ninjapipeProps.staticDropdown({ displayName: 'Priority', description: 'Task priority.', values: TASK_PRIORITIES }),
    assigneeId: ninjapipeProps.member({ displayName: 'Assignee', description: 'Workspace member the task is assigned to.' }),
    dueDate: Property.DateTime({ displayName: 'Due Date', description: 'Date (YYYY-MM-DD).', required: false }),
    parentId: Property.ShortText({ displayName: 'Parent Task ID', description: 'Make this a subtask of another task in the same project.', required: false }),
    estimatedHours: Property.Number({ displayName: 'Estimated Hours', required: false }),
    tags: Property.Array({ displayName: 'Tags', required: false }),
  };
}

function parentFilter({ parentId, rootOnly }: { parentId: string | undefined; rootOnly: boolean | undefined }): string | undefined {
  const id = parentId?.trim();
  if (id) return id;
  if (rootOnly === true) return '';
  return undefined;
}

function taskBody(p: TaskInput): NinjaPipeRecord {
  return ninjapipeFields.compact({
    title: p.title,
    description: p.description,
    status: p.status,
    priority: p.priority,
    assignee_id: p.assigneeId,
    due_date: ninjapipeFields.toDateOnly({ value: p.dueDate, field: 'Due Date' }),
    parent_id: p.parentId,
    estimated_hours: ninjapipeFields.toNumber({ value: p.estimatedHours, field: 'Estimated Hours' }),
    tags: ninjapipeFields.toStringList(p.tags),
  });
}

const TASK_STATUSES = ['To Do', 'In Progress', 'Done', 'Cancelled'];
const TASK_PRIORITIES = ['High', 'Medium', 'Low'];
const TASK_CLEARABLE: Record<string, string> = {
  description: 'Description',
  assignee_id: 'Assignee',
  due_date: 'Due Date',
  parent_id: 'Parent Task',
  estimated_hours: 'Estimated Hours',
};

export const ninjapipeTasks = { taskProps, taskBody, parentFilter, TASK_STATUSES, TASK_PRIORITIES, TASK_CLEARABLE };

export type TaskInput = {
  title?: unknown;
  description?: unknown;
  status?: unknown;
  priority?: unknown;
  assigneeId?: unknown;
  dueDate?: unknown;
  parentId?: unknown;
  estimatedHours?: unknown;
  tags?: unknown;
};

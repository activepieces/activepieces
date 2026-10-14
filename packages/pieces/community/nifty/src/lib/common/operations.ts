import { HttpMethod } from '@activepieces/pieces-common';
import { NiftyAuth, niftyClient, NiftyRecord } from './client';

export const niftyOps = {
  async createTask({ auth, input }: { auth: NiftyAuth; input: TaskCreateInput }): Promise<NiftyRecord> {
    const body = buildTaskCreateBody(input);
    return niftyClient.requestRecord({ auth, method: HttpMethod.POST, path: 'tasks', body });
  },

  async getTask({ auth, taskId }: { auth: NiftyAuth; taskId: unknown }): Promise<NiftyRecord> {
    const id = niftyClient.requireId({ value: taskId, label: 'Task ID' });
    return niftyClient.requestRecord({ auth, method: HttpMethod.GET, path: `tasks/${niftyClient.segment(id)}` });
  },

  async updateTask({ auth, input }: { auth: NiftyAuth; input: TaskUpdateInput }): Promise<NiftyRecord> {
    const id = niftyClient.requireId({ value: input.taskId, label: 'Task ID' });
    const body = buildTaskUpdateBody(input);
    const completion = parseCompletion(input.completion);
    if (Object.keys(body).length === 0 && completion === undefined) {
      throw new Error('Nothing to update: set at least one field, a clear option, or a completion change.');
    }
    if (Object.keys(body).length > 0) {
      await niftyClient.request({ auth, method: HttpMethod.PUT, path: `tasks/${niftyClient.segment(id)}`, body });
    }
    if (completion !== undefined) {
      await setCompletion({ auth, taskId: id, completed: completion });
    }
    return niftyOps.getTask({ auth, taskId: id });
  },

  async setTaskCompletion({ auth, taskId, completed }: { auth: NiftyAuth; taskId: unknown; completed: boolean }): Promise<NiftyRecord> {
    const id = niftyClient.requireId({ value: taskId, label: 'Task ID' });
    await setCompletion({ auth, taskId: id, completed });
    return niftyOps.getTask({ auth, taskId: id });
  },

  async deleteTask({ auth, taskId }: { auth: NiftyAuth; taskId: unknown }): Promise<{ id: string; deleted: boolean; message: string }> {
    const id = niftyClient.requireId({ value: taskId, label: 'Task' });
    const response = await niftyClient.request({ auth, method: HttpMethod.DELETE, path: `tasks/${niftyClient.segment(id)}` });
    const message = niftyClient.isRecord(response.body) ? niftyClient.text({ record: response.body, key: 'message' }) : '';
    return { id, deleted: true, message };
  },

  async changeAssignees({
    auth,
    taskId,
    memberIds,
    mode,
  }: {
    auth: NiftyAuth;
    taskId: unknown;
    memberIds: unknown;
    mode: 'add' | 'remove';
  }): Promise<{ task_id: string; member_ids: string[]; task: NiftyRecord }> {
    const id = niftyClient.requireId({ value: taskId, label: 'Task ID' });
    const ids = niftyClient.idList({ value: memberIds, label: 'Member ID' });
    if (ids.length === 0) {
      throw new Error('Give at least one member ID. Use List Members to find them.');
    }
    await niftyClient.request({
      auth,
      method: mode === 'add' ? HttpMethod.PUT : HttpMethod.DELETE,
      path: `tasks/${niftyClient.segment(id)}/assignees`,
      body: { assignees: ids },
    });
    const task = await niftyOps.getTask({ auth, taskId: id });
    return { task_id: id, member_ids: ids, task };
  },

  async createProject({ auth, input }: { auth: NiftyAuth; input: ProjectCreateInput }): Promise<NiftyRecord> {
    const body = dropUndefined({
      name: niftyClient.requireName({ value: input.name, label: 'Project name', max: 100 }),
      subteam_id: niftyClient.optionalId({ value: input.portfolioId, label: 'Portfolio ID' }),
      description: niftyClient.optionalText(input.description),
      access_type: parseChoice({ value: input.accessType, label: 'Access type', allowed: ACCESS_TYPES }),
      default_tasks_view: parseChoice({ value: input.defaultTasksView, label: 'Default tasks view', allowed: TASK_VIEWS }),
    });
    const project = await niftyClient.requestRecord({ auth, method: HttpMethod.POST, path: 'projects', body });
    return niftyClient.cleanProject(project);
  },

  async getProject({ auth, projectId }: { auth: NiftyAuth; projectId: unknown }): Promise<NiftyRecord> {
    const id = niftyClient.requireId({ value: projectId, label: 'Project ID' });
    const project = await niftyClient.requestRecord({ auth, method: HttpMethod.GET, path: `projects/${niftyClient.segment(id)}` });
    return niftyClient.cleanProject(project);
  },

  async updateProject({ auth, input }: { auth: NiftyAuth; input: ProjectUpdateInput }): Promise<NiftyRecord> {
    const id = niftyClient.requireId({ value: input.projectId, label: 'Project ID' });
    const archived = parseArchive(input.archive);
    const body = dropUndefined({
      name: niftyClient.optionalName({ value: input.name, label: 'Project name', max: 100 }),
      description: niftyClient.optionalText(input.description),
      access_type: parseChoice({ value: input.accessType, label: 'Access type', allowed: ACCESS_TYPES }),
      default_tasks_view: parseChoice({ value: input.defaultTasksView, label: 'Default tasks view', allowed: TASK_VIEWS }),
      archived: archived === undefined ? undefined : String(archived),
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Nothing to update: set at least one field or an archive change.');
    }
    await niftyClient.request({ auth, method: HttpMethod.PUT, path: `projects/${niftyClient.segment(id)}`, body });
    return niftyOps.getProject({ auth, projectId: id });
  },

  async createMilestone({ auth, input }: { auth: NiftyAuth; input: MilestoneCreateInput }): Promise<NiftyRecord> {
    const projectId = niftyClient.requireId({ value: input.projectId, label: 'Project ID' });
    const name = niftyClient.requireName({ value: input.name, label: 'Name', max: 255 });
    const isList = input.createAsList === true;
    const start = niftyClient.optionalIsoDate({ value: input.start, label: 'Start date' });
    const end = niftyClient.optionalIsoDate({ value: input.end, label: 'End date' });
    if (!isList && (start === undefined || end === undefined)) {
      throw new Error('A milestone needs both a start date and an end date. To create a plain task list without dates, turn on "Create as list".');
    }
    if (start !== undefined && end !== undefined && Date.parse(start) > Date.parse(end)) {
      throw new Error('The start date must be on or before the end date.');
    }
    const body = dropUndefined({
      project_id: projectId,
      name,
      description: niftyClient.optionalText(input.description) ?? '',
      start,
      end,
      is_list: isList ? true : undefined,
    });
    const created = await niftyClient.requestRecord({ auth, method: HttpMethod.POST, path: 'milestones', body });
    const id = niftyClient.text({ record: created, key: 'id' });
    if (id.length === 0) {
      throw new Error(`Nifty did not return the new milestone ID: ${JSON.stringify(created).slice(0, 200)}`);
    }
    try {
      return await niftyClient.requestRecord({ auth, method: HttpMethod.GET, path: `milestones/${niftyClient.segment(id)}` });
    } catch (error) {
      return {
        id,
        name,
        project: projectId,
        is_list: isList,
        start: start ?? null,
        end: end ?? null,
        read_back_error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  buildTaskCreateBody,
};

function buildTaskCreateBody(input: TaskCreateInput): Record<string, unknown> {
  const assignees = niftyClient.idList({ value: input.assigneeIds, label: 'Assignee ID' });
  const start = niftyClient.optionalIsoDate({ value: input.startDate, label: 'Start date' });
  const due = niftyClient.optionalIsoDate({ value: input.dueDate, label: 'Due date' });
  assertDateOrder({ start, due });
  return dropUndefined({
    name: niftyClient.requireName({ value: input.name, label: 'Task name', max: 1024 }),
    task_group_id: niftyClient.requireId({ value: input.statusId, label: 'Status ID' }),
    description: niftyClient.optionalText(input.description),
    milestone_id: niftyClient.optionalId({ value: input.milestoneId, label: 'Milestone ID' }),
    task_id: niftyClient.optionalId({ value: input.parentTaskId, label: 'Parent task ID' }),
    start_date: start,
    due_date: due,
    story_points: niftyClient.optionalNumber({ value: input.storyPoints, label: 'Story points', min: 0, max: 1000, integer: false }),
    assignees: assignees.length > 0 ? assignees : undefined,
  });
}

function buildTaskUpdateBody(input: TaskUpdateInput): Record<string, unknown> {
  const start = niftyClient.optionalIsoDate({ value: input.startDate, label: 'Start date' });
  const due = niftyClient.optionalIsoDate({ value: input.dueDate, label: 'Due date' });
  const description = niftyClient.optionalText(input.description);
  assertNotBoth({ value: description, clear: input.clearDescription, label: 'Description' });
  assertNotBoth({ value: start, clear: input.clearStartDate, label: 'Start date' });
  assertNotBoth({ value: due, clear: input.clearDueDate, label: 'Due date' });
  assertDateOrder({ start, due });
  return dropUndefined({
    name: niftyClient.optionalName({ value: input.name, label: 'Task name', max: 1024 }),
    description: input.clearDescription === true ? '' : description,
    task_group_id: niftyClient.optionalId({ value: input.statusId, label: 'Status ID' }),
    milestone_id: niftyClient.optionalId({ value: input.milestoneId, label: 'Milestone ID' }),
    start_date: input.clearStartDate === true ? null : start,
    due_date: input.clearDueDate === true ? null : due,
    story_points: niftyClient.optionalNumber({ value: input.storyPoints, label: 'Story points', min: 0, max: 1000, integer: false }),
  });
}

async function setCompletion({ auth, taskId, completed }: { auth: NiftyAuth; taskId: string; completed: boolean }): Promise<void> {
  await niftyClient.request({
    auth,
    method: HttpMethod.POST,
    path: `tasks/${niftyClient.segment(taskId)}/complete`,
    body: { completed },
  });
}

function parseCompletion(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '' || value === 'unchanged') {
    return undefined;
  }
  if (value === 'complete') {
    return true;
  }
  if (value === 'reopen') {
    return false;
  }
  throw new Error(`Completion must be "unchanged", "complete" or "reopen", got "${String(value)}".`);
}

function parseArchive(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '' || value === 'unchanged') {
    return undefined;
  }
  if (value === 'archive') {
    return true;
  }
  if (value === 'unarchive') {
    return false;
  }
  throw new Error(`Archive must be "unchanged", "archive" or "unarchive", got "${String(value)}".`);
}

function parseChoice({ value, label, allowed }: { value: unknown; label: string; allowed: readonly string[] }): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const choice = typeof value === 'string' ? value.trim() : '';
  if (!allowed.includes(choice)) {
    throw new Error(`${label} must be one of ${allowed.join(', ')}, got "${String(value)}".`);
  }
  return choice;
}

function assertNotBoth({ value, clear, label }: { value: unknown; clear: unknown; label: string }): void {
  if (value !== undefined && clear === true) {
    throw new Error(`${label}: either give a new value or turn on the clear option, not both.`);
  }
}

function assertDateOrder({ start, due }: { start: string | undefined; due: string | undefined }): void {
  if (start !== undefined && due !== undefined && Date.parse(start) > Date.parse(due)) {
    throw new Error('The start date must be on or before the due date.');
  }
}

function dropUndefined(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

const ACCESS_TYPES = ['public', 'limited', 'workspace'] as const;
const TASK_VIEWS = ['table', 'kanban', 'swimlane', 'timeline'] as const;

export const NIFTY_ACCESS_TYPE_OPTIONS = [
  { label: 'Public (everyone in the workspace can find and join)', value: 'public' },
  { label: 'Workspace (every workspace member is a member)', value: 'workspace' },
  { label: 'Limited (only invited members)', value: 'limited' },
];

export const NIFTY_TASK_VIEW_OPTIONS = [
  { label: 'Table', value: 'table' },
  { label: 'Kanban', value: 'kanban' },
  { label: 'Swimlane', value: 'swimlane' },
  { label: 'Timeline', value: 'timeline' },
];

export const NIFTY_ARCHIVE_OPTIONS = [
  { label: 'Leave unchanged', value: 'unchanged' },
  { label: 'Archive', value: 'archive' },
  { label: 'Unarchive', value: 'unarchive' },
];

export const NIFTY_COMPLETION_OPTIONS = [
  { label: 'Leave unchanged', value: 'unchanged' },
  { label: 'Mark complete', value: 'complete' },
  { label: 'Reopen', value: 'reopen' },
];

export type TaskCreateInput = {
  statusId: unknown;
  name: unknown;
  description?: unknown;
  milestoneId?: unknown;
  parentTaskId?: unknown;
  startDate?: unknown;
  dueDate?: unknown;
  storyPoints?: unknown;
  assigneeIds?: unknown;
};

export type TaskUpdateInput = {
  taskId: unknown;
  name?: unknown;
  description?: unknown;
  clearDescription?: unknown;
  statusId?: unknown;
  milestoneId?: unknown;
  startDate?: unknown;
  clearStartDate?: unknown;
  dueDate?: unknown;
  clearDueDate?: unknown;
  storyPoints?: unknown;
  completion?: unknown;
};

export type ProjectCreateInput = {
  name: unknown;
  portfolioId?: unknown;
  description?: unknown;
  accessType?: unknown;
  defaultTasksView?: unknown;
};

export type ProjectUpdateInput = {
  projectId: unknown;
  name?: unknown;
  description?: unknown;
  accessType?: unknown;
  defaultTasksView?: unknown;
  archive?: unknown;
};

export type MilestoneCreateInput = {
  projectId: unknown;
  name: unknown;
  description?: unknown;
  start?: unknown;
  end?: unknown;
  createAsList?: unknown;
};

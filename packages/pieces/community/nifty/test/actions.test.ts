import { HttpMethod } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nifty } from '../src/index';
import { createTask } from '../src/lib/actions/create-task';
import { niftyTaskCreate } from '../src/lib/actions/ai/task-create';
import { niftyTaskUpdate } from '../src/lib/actions/ai/task-update';
import { niftyProjectCreate } from '../src/lib/actions/ai/project-create';
import { niftyProjectUpdate } from '../src/lib/actions/ai/project-update';
import { niftyMilestoneCreate } from '../src/lib/actions/ai/milestone-create';
import { completeTask } from '../src/lib/actions/complete-task';
import { deleteTask } from '../src/lib/actions/delete-task';
import { addTaskAssignees } from '../src/lib/actions/add-task-assignees';
import { removeTaskAssignees } from '../src/lib/actions/remove-task-assignees';
import { findTasks } from '../src/lib/actions/find-tasks';
import { findProjects } from '../src/lib/actions/find-projects';
import { listMilestones } from '../src/lib/actions/list-milestones';
import { listMembers } from '../src/lib/actions/list-members';
import { created, httpError, ok, runAction, task } from './helpers';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) } };
});

beforeEach(() => {
  sendRequest.mockReset();
});

function call(index: number) {
  return sendRequest.mock.calls[index][0];
}

describe('piece metadata', () => {
  it('every action has audience, classification and aiMetadata; triggers are READ with sample data', () => {
    for (const action of Object.values(nifty.actions())) {
      if (action.name === 'custom_api_call') continue;
      expect(action.audience, action.name).toBeDefined();
      expect(action.classification, action.name).toBeDefined();
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
    }
    for (const trigger of Object.values(nifty.triggers())) {
      expect(trigger.classification).toBe('READ');
      expect(trigger.sampleData).toBeTruthy();
      expect(trigger.aiMetadata?.description).toBeTruthy();
    }
    expect(nifty.minimumSupportedRelease).toBe('0.88.2');
  });

  it('keeps create_task prop keys and makes milestone and portfolio optional', () => {
    expect(Object.keys(createTask.props)).toEqual(
      expect.arrayContaining(['portfolio', 'project', 'status', 'milestone', 'task_name', 'task_description'])
    );
    expect(createTask.props.milestone.required).toBe(false);
    expect(createTask.props.portfolio.required).toBe(false);
    expect(createTask.audience).toBe('human');
    expect(deleteTask.audience).toBe('human');
    expect(deleteTask.classification).toBe('DESTRUCTIVE');
  });
});

describe('Create Task (existing)', () => {
  it('creates without a milestone and still returns an array', async () => {
    sendRequest.mockResolvedValueOnce(created(task({ id: 'new' })));
    const result = await runAction({
      action: createTask,
      propsValue: { project: 'p1', status: 's1', task_name: ' Write docs ', task_description: undefined, milestone: undefined },
    });
    expect(call(0).method).toBe(HttpMethod.POST);
    expect(call(0).url).toBe('https://openapi.niftypm.com/api/v1.0/tasks');
    expect(call(0).body).toEqual({ name: 'Write docs', task_group_id: 's1' });
    expect(result).toEqual([task({ id: 'new' })]);
  });

  it('sends the new optional fields', async () => {
    sendRequest.mockResolvedValueOnce(created(task({})));
    await runAction({
      action: createTask,
      propsValue: {
        project: 'p1',
        status: 's1',
        milestone: 'm1',
        task_name: 'Sub',
        parent_task: 'parent',
        start_date: '2026-10-06T00:00:00.000Z',
        due_date: '2026-10-20T00:00:00.000Z',
        assignees: ['u1'],
      },
    });
    expect(call(0).body).toEqual({
      name: 'Sub',
      task_group_id: 's1',
      milestone_id: 'm1',
      task_id: 'parent',
      start_date: '2026-10-06T00:00:00.000Z',
      due_date: '2026-10-20T00:00:00.000Z',
      assignees: ['u1'],
    });
  });
});

describe('Create Task (AI)', () => {
  it('validates before any request', async () => {
    await expect(runAction({ action: niftyTaskCreate, propsValue: { status_id: 's1', name: '   ' } })).rejects.toThrow('Task name is required');
    await expect(
      runAction({ action: niftyTaskCreate, propsValue: { status_id: 's1', name: 'x', start_date: '2026-10-10', due_date: '2026-10-01' } })
    ).rejects.toThrow('start date must be on or before');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('returns the created task object', async () => {
    sendRequest.mockResolvedValueOnce(created(task({ id: 'ai' })));
    const result = await runAction({ action: niftyTaskCreate, propsValue: { status_id: 's1', name: 'x', story_points: 2, assignee_ids: ['u1', 'u1'] } });
    expect(call(0).body).toEqual({ name: 'x', task_group_id: 's1', story_points: 2, assignees: ['u1'] });
    expect(result).toEqual(task({ id: 'ai' }));
  });
});

describe('Update Task (AI)', () => {
  it('refuses an empty update', async () => {
    await expect(runAction({ action: niftyTaskUpdate, propsValue: { task_id: 't1', completion: 'unchanged' } })).rejects.toThrow('Nothing to update');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('sends only set fields, null for cleared dates, then completes and re-reads', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ message: 'Succesfully edited task' }))
      .mockResolvedValueOnce(created({ message: 'Successfully changed task state' }))
      .mockResolvedValueOnce(ok(task({ completed: true })));
    const result = await runAction({
      action: niftyTaskUpdate,
      propsValue: { task_id: 't1', name: 'New', clear_due_date: true, clear_description: true, status_id: 's2', completion: 'complete' },
    });
    expect(call(0).method).toBe(HttpMethod.PUT);
    expect(call(0).url).toBe('https://openapi.niftypm.com/api/v1.0/tasks/t1');
    expect(call(0).body).toEqual({ name: 'New', description: '', task_group_id: 's2', due_date: null });
    expect(call(1).url).toBe('https://openapi.niftypm.com/api/v1.0/tasks/t1/complete');
    expect(call(1).body).toEqual({ completed: true });
    expect(call(2).method).toBe(HttpMethod.GET);
    expect(result).toEqual(task({ completed: true }));
  });

  it('rejects a value together with its clear option', async () => {
    await expect(
      runAction({ action: niftyTaskUpdate, propsValue: { task_id: 't1', due_date: '2026-10-01', clear_due_date: true } })
    ).rejects.toThrow('not both');
  });

  it('reopens without a PUT when only completion changes', async () => {
    sendRequest.mockResolvedValueOnce(created({ message: 'ok' })).mockResolvedValueOnce(ok(task({})));
    await runAction({ action: niftyTaskUpdate, propsValue: { task_id: 't1', completion: 'reopen' } });
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(call(0).body).toEqual({ completed: false });
  });
});

describe('Complete or Reopen Task', () => {
  it('posts completed=true and returns the task', async () => {
    sendRequest.mockResolvedValueOnce(created({ message: 'ok' })).mockResolvedValueOnce(ok(task({ completed: true })));
    const result = await runAction({ action: completeTask, propsValue: { project: 'p1', task: 't!1', action: 'complete' } });
    expect(call(0).url).toBe('https://openapi.niftypm.com/api/v1.0/tasks/t!1/complete');
    expect(result).toMatchObject({ completed: true });
  });
});

describe('Delete Task', () => {
  it('returns the id after deleting', async () => {
    sendRequest.mockResolvedValueOnce(ok({ message: 'Successfully removed task' }));
    const result = await runAction({ action: deleteTask, propsValue: { project: 'p1', task: 't1' } });
    expect(call(0).method).toBe(HttpMethod.DELETE);
    expect(result).toEqual({ id: 't1', deleted: true, message: 'Successfully removed task' });
  });

  it('fails on a missing task', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 404, body: { message: 'This task has been deleted or no longer exists.' } }));
    await expect(runAction({ action: deleteTask, propsValue: { project: 'p1', task: 't1' } })).rejects.toThrow('(404)');
  });
});

describe('Assignees', () => {
  it('add uses PUT and remove uses DELETE with only the given ids, then re-reads', async () => {
    sendRequest.mockResolvedValueOnce(ok({ message: 'ok' })).mockResolvedValueOnce(ok(task({ assignees: ['u1'] })));
    const added = await runAction({ action: addTaskAssignees, propsValue: { task_id: 't1', member_ids: ['u1'] } });
    expect(call(0)).toMatchObject({ method: HttpMethod.PUT, body: { assignees: ['u1'] } });
    expect(added).toEqual({ task_id: 't1', member_ids: ['u1'], task: task({ assignees: ['u1'] }) });
    sendRequest.mockResolvedValueOnce(ok({ message: 'ok' })).mockResolvedValueOnce(ok(task({ assignees: [] })));
    await runAction({ action: removeTaskAssignees, propsValue: { task_id: 't1', member_ids: ['u1'] } });
    expect(call(2)).toMatchObject({ method: HttpMethod.DELETE, url: 'https://openapi.niftypm.com/api/v1.0/tasks/t1/assignees' });
  });

  it('refuses an empty member list', async () => {
    await expect(runAction({ action: addTaskAssignees, propsValue: { task_id: 't1', member_ids: [] } })).rejects.toThrow('at least one member');
  });
});

describe('Projects', () => {
  it('create sends only given fields and strips meeting passwords', async () => {
    sendRequest.mockResolvedValueOnce(created({ id: 'p9', name: 'X', zoom_password: 'secret' }));
    const result = await runAction({ action: niftyProjectCreate, propsValue: { name: 'X', access_type: 'limited' } });
    expect(call(0).body).toEqual({ name: 'X', access_type: 'limited' });
    expect(result).toEqual({ id: 'p9', name: 'X' });
  });

  it('create rejects an unknown access type', async () => {
    await expect(runAction({ action: niftyProjectCreate, propsValue: { name: 'X', access_type: 'private' } })).rejects.toThrow('Access type must be one of');
  });

  it('update sends archived as the string Nifty expects and re-reads', async () => {
    sendRequest.mockResolvedValueOnce(ok({ message: 'ok', id: 'p1' })).mockResolvedValueOnce(ok({ id: 'p1', archived: true }));
    await runAction({ action: niftyProjectUpdate, propsValue: { project_id: 'p1', archive: 'archive' } });
    expect(call(0).body).toEqual({ archived: 'true' });
    expect(call(1).url).toBe('https://openapi.niftypm.com/api/v1.0/projects/p1');
  });

  it('update refuses no changes', async () => {
    await expect(runAction({ action: niftyProjectUpdate, propsValue: { project_id: 'p1', archive: 'unchanged' } })).rejects.toThrow('Nothing to update');
  });

  it('find merges archived projects only when asked and filters by name', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ projects: [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }] }))
      .mockResolvedValueOnce(ok({ projects: [{ id: 'c', name: 'Alpha old', archived: true }] }));
    const result = await runAction({ action: findProjects, propsValue: { name_contains: 'alpha', include_archived: true } });
    expect(call(1).queryParams).toMatchObject({ archived: 'true' });
    expect(result).toEqual({
      items: [
        { id: 'a', name: 'Alpha' },
        { id: 'c', name: 'Alpha old', archived: true },
      ],
      truncated: false,
    });
  });
});

describe('Milestones', () => {
  it('requires both dates for a milestone', async () => {
    await expect(runAction({ action: niftyMilestoneCreate, propsValue: { project_id: 'p1', name: 'M', start_date: '2026-10-06' } })).rejects.toThrow(
      'needs both a start date and an end date'
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('creates a list without dates and returns the read-back record', async () => {
    sendRequest.mockResolvedValueOnce(created({ message: 'ok', id: 'm1' })).mockResolvedValueOnce(ok({ id: 'm1', name: 'L', is_list: true }));
    const result = await runAction({ action: niftyMilestoneCreate, propsValue: { project_id: 'p1', name: 'L', create_as_list: true } });
    expect(call(0).body).toEqual({ project_id: 'p1', name: 'L', description: '', is_list: true });
    expect(result).toEqual({ id: 'm1', name: 'L', is_list: true });
  });

  it('reports a failed read-back instead of failing after the create', async () => {
    sendRequest.mockResolvedValueOnce(created({ message: 'ok', id: 'm1' })).mockRejectedValueOnce(httpError({ status: 500, body: 'oops' }));
    const result = await runAction({
      action: niftyMilestoneCreate,
      propsValue: { project_id: 'p1', name: 'M', start_date: '2026-10-06', end_date: '2026-10-20' },
    });
    expect(result).toMatchObject({ id: 'm1', name: 'M', read_back_error: expect.stringContaining('500') });
  });

  it('list filters by kind', async () => {
    sendRequest.mockResolvedValueOnce(ok({ items: [{ id: 'm', is_list: false }, { id: 'l', is_list: true }] }));
    const result = await runAction({ action: listMilestones, propsValue: { project_id: 'p1', kind: 'milestones' } });
    expect(result).toEqual({ items: [{ id: 'm', is_list: false }] });
  });
});

describe('Find Tasks', () => {
  it('maps filters to v1 query params and reports paging', async () => {
    sendRequest.mockResolvedValueOnce(ok({ tasks: [task({ id: 'a' }), task({ id: 'b' })], hasMore: true }));
    const result = await runAction({
      action: findTasks,
      propsValue: { project_id: 'p1', status_id: 's1', completion: 'open', include_subtasks: true, limit: 2, offset: 4, due_from: '2026-10-01', due_to: '2026-10-31' },
    });
    expect(call(0).queryParams).toEqual({
      project_id: 'p1',
      task_group_id: 's1',
      completed: 'false',
      include_subtasks: 'true',
      from: '2026-10-01T00:00:00.000Z',
      to: '2026-10-31T00:00:00.000Z',
      limit: '2',
      offset: '4',
    });
    expect(result).toMatchObject({ has_more: true, next_offset: 6 });
  });

  it('refuses a one-sided due window and subtasks without a project', async () => {
    await expect(runAction({ action: findTasks, propsValue: { due_from: '2026-10-01' } })).rejects.toThrow('Set both Due From and Due To');
    await expect(runAction({ action: findTasks, propsValue: { include_subtasks: true } })).rejects.toThrow('needs a Project ID');
  });
});

describe('List Members', () => {
  it('uses the paged envelope, hides removed members and curates fields', async () => {
    sendRequest.mockResolvedValueOnce(
      ok({ items: [{ id: 'u1', name: 'A', email: 'a@x.io', theme: 'dark' }, { id: 'u2', name: 'B', removed: true }], hasMore: false })
    );
    const result = await runAction({ action: listMembers, propsValue: {} });
    expect(call(0).queryParams).toEqual({ limit: '1000', offset: '0' });
    expect(result).toEqual({ items: [{ id: 'u1', name: 'A', email: 'a@x.io' }] });
  });
});

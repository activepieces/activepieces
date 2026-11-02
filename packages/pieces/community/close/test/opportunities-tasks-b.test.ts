import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOpportunityAi } from '../src/lib/actions/ai/create-opportunity-ai';
import { getOpportunity } from '../src/lib/actions/ai/get-opportunity';
import { updateOpportunity } from '../src/lib/actions/ai/update-opportunity';
import { deleteOpportunity } from '../src/lib/actions/ai/delete-opportunity';
import { listOpportunities } from '../src/lib/actions/ai/list-opportunities';
import { createTask } from '../src/lib/actions/ai/create-task';
import { getTask } from '../src/lib/actions/ai/get-task';
import { updateTask } from '../src/lib/actions/ai/update-task';
import { deleteTask } from '../src/lib/actions/ai/delete-task';
import { listTasks } from '../src/lib/actions/ai/list-tasks';

const auth = { secret_text: 'api_secret' };

const rawOpp = { id: 'oppo_1', lead_id: 'lead_1', value: 340000, value_period: 'one_time', status_type: 'active', 'custom.cf_a': 'x' };
const rawTask = { id: 'task_1', _type: 'lead', lead_id: 'lead_1', text: 'Call', is_complete: false };

function mock(...bodies: unknown[]) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const body of bodies) spy.mockResolvedValueOnce({ status: 200, headers: {}, body });
  return spy;
}

function run({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }) {
  return Reflect.apply(Reflect.get(action, 'run'), undefined, [{ auth, propsValue }]);
}

function sent(spy: ReturnType<typeof mock>) {
  return spy.mock.calls[0][0];
}

afterEach(() => vi.restoreAllMocks());

describe('metadata', () => {
  const all = [createOpportunityAi, getOpportunity, updateOpportunity, deleteOpportunity, listOpportunities, createTask, getTask, updateTask, deleteTask, listTasks];
  it('all are ai actions with outputSchema and aiMetadata', () => {
    for (const a of all) {
      expect(a.audience, a.name).toBe('ai');
      expect(a.outputSchema, a.name).toBeDefined();
      expect(a.aiMetadata?.description, a.name).toBeTruthy();
    }
  });
  it('classifications match side effects', () => {
    expect(createOpportunityAi.classification).toBe('WRITE');
    expect(deleteTask.classification).toBe('DESTRUCTIVE');
    expect(listTasks.classification).toBe('SEARCH');
    expect(getOpportunity.classification).toBe('READ');
  });
});

describe('opportunities', () => {
  it('create posts integer cents and maps valueCents', async () => {
    const spy = mock(rawOpp);
    const out = await run({ action: createOpportunityAi, propsValue: { leadId: 'lead_1', valueCents: 340000, valuePeriod: 'one_time', expectedCloseDate: '2026-11-30', customFields: { cf_a: 'x' } } });
    const req = sent(spy);
    expect(req.method).toBe(HttpMethod.POST);
    expect(req.url).toBe('https://api.close.com/api/v1/opportunity/');
    expect(req.body).toEqual({ lead_id: 'lead_1', value: 340000, value_period: 'one_time', date_won: '2026-11-30', 'custom.cf_a': 'x' });
    expect(out.valueCents).toBe(340000);
    expect(out.custom).toEqual({ cf_a: 'x' });
  });
  it('create rejects fractional cents and bad period', async () => {
    await expect(run({ action: createOpportunityAi, propsValue: { leadId: 'lead_1', valueCents: 12.5 } })).rejects.toThrow('Value (cents)');
    await expect(run({ action: createOpportunityAi, propsValue: { leadId: 'lead_1', valuePeriod: 'weekly' } })).rejects.toThrow('Value Period');
  });
  it('get uses the opportunity path', async () => {
    const spy = mock(rawOpp);
    const out = await run({ action: getOpportunity, propsValue: { opportunityId: 'oppo_1' } });
    expect(sent(spy).url).toBe('https://api.close.com/api/v1/opportunity/oppo_1/');
    expect(out.id).toBe('oppo_1');
  });
  it('get rejects wrong prefix', async () => {
    await expect(run({ action: getOpportunity, propsValue: { opportunityId: 'lead_1' } })).rejects.toThrow('oppo_');
  });
  it('update sends only passed fields with PUT', async () => {
    const spy = mock(rawOpp);
    await run({ action: updateOpportunity, propsValue: { opportunityId: 'oppo_1', statusId: 'stat_won', confidence: 90 } });
    expect(sent(spy).method).toBe(HttpMethod.PUT);
    expect(sent(spy).body).toEqual({ status_id: 'stat_won', confidence: 90 });
  });
  it('update with no fields fails before calling', async () => {
    const spy = mock();
    await expect(run({ action: updateOpportunity, propsValue: { opportunityId: 'oppo_1' } })).rejects.toThrow('at least one');
    expect(spy).not.toHaveBeenCalled();
  });
  it('delete returns deleted', async () => {
    const spy = mock({});
    expect(await run({ action: deleteOpportunity, propsValue: { opportunityId: 'oppo_1' } })).toEqual({ deleted: true, id: 'oppo_1' });
    expect(sent(spy).method).toBe(HttpMethod.DELETE);
  });
  it('list passes filters and pages', async () => {
    const spy = mock({ data: [rawOpp], has_more: true });
    const out = await run({ action: listOpportunities, propsValue: { statusType: 'won', closeDateFrom: '2026-01-01', limit: 10, skip: 20 } });
    expect(sent(spy).queryParams).toMatchObject({ status_type: 'won', date_won__gte: '2026-01-01', _limit: '10', _skip: '20' });
    expect(out).toMatchObject({ count: 1, hasMore: true, nextSkip: 21 });
  });
});

describe('tasks', () => {
  it('create posts a lead task', async () => {
    const spy = mock(rawTask);
    const out = await run({ action: createTask, propsValue: { leadId: 'lead_1', text: ' Call ', date: '2026-10-20' } });
    expect(sent(spy).body).toEqual({ _type: 'lead', lead_id: 'lead_1', text: 'Call', date: '2026-10-20' });
    expect(out.isComplete).toBe(false);
  });
  it('create requires text', async () => {
    await expect(run({ action: createTask, propsValue: { leadId: 'lead_1', text: ' ' } })).rejects.toThrow('Text is required');
  });
  it('get maps task', async () => {
    const spy = mock(rawTask);
    const out = await run({ action: getTask, propsValue: { taskId: 'task_1' } });
    expect(sent(spy).url).toBe('https://api.close.com/api/v1/task/task_1/');
    expect(out.type).toBe('lead');
  });
  it('update completes a task', async () => {
    const spy = mock({ ...rawTask, is_complete: true });
    const out = await run({ action: updateTask, propsValue: { taskId: 'task_1', isComplete: 'true' } });
    expect(sent(spy).body).toEqual({ is_complete: true });
    expect(out.isComplete).toBe(true);
  });
  it('update rejects bad boolean', async () => {
    await expect(run({ action: updateTask, propsValue: { taskId: 'task_1', isComplete: 'yes' } })).rejects.toThrow('true or false');
  });
  it('delete returns deleted', async () => {
    mock({});
    expect(await run({ action: deleteTask, propsValue: { taskId: 'task_1' } })).toEqual({ deleted: true, id: 'task_1' });
  });
  it('list sends lead type by default and view', async () => {
    const spy = mock({ data: [rawTask], has_more: false });
    const out = await run({ action: listTasks, propsValue: { view: 'inbox', isComplete: 'false' } });
    expect(sent(spy).queryParams).toMatchObject({ _type: 'lead', view: 'inbox', is_complete: 'false' });
    expect(out).toMatchObject({ count: 1, hasMore: false, nextSkip: null });
  });
  it('list sends _type all when includeNotifications is on', async () => {
    const spy = mock({ data: [rawTask], has_more: false });
    await run({ action: listTasks, propsValue: { leadId: 'lead_1', includeNotifications: true } });
    expect(sent(spy).queryParams).toMatchObject({ _type: 'all', lead_id: 'lead_1' });
  });
  it('list rejects bad view', async () => {
    await expect(run({ action: listTasks, propsValue: { view: 'today' } })).rejects.toThrow('View');
  });
});

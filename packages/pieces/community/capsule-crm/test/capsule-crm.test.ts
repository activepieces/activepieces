import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpClient, HttpError, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { capsuleCrmClient } from '../src/lib/common/client';
import { aiCreateTask } from '../src/lib/actions/ai/ai-create-task';
import { aiAddNote } from '../src/lib/actions/ai/ai-add-note';
import { aiSearchProjects } from '../src/lib/actions/ai/ai-search-projects';
import { aiCreateProject } from '../src/lib/actions/ai/ai-create-project';
import { aiCreateOpportunity } from '../src/lib/actions/ai/ai-create-opportunity';
import { capsuleCrm } from '../src/index';
import { aiDeleteParty } from '../src/lib/actions/ai/ai-delete-party';
import { aiCompleteTask } from '../src/lib/actions/ai/ai-complete-task';
import { aiListEntries } from '../src/lib/actions/ai/ai-list-entries';
import { aiListTasks } from '../src/lib/actions/ai/ai-list-tasks';
import { aiGetOpportunity } from '../src/lib/actions/ai/ai-get-opportunity';
import { aiSearchOpportunities } from '../src/lib/actions/ai/ai-search-opportunities';
import { findContactAction } from '../src/lib/actions/find-contact';
import { findProjectAction } from '../src/lib/actions/find-project';
import { newTaskTrigger } from '../src/lib/triggers/new-task';
import { newCaseTrigger } from '../src/lib/triggers/new-case';
import { newOpportunityTrigger } from '../src/lib/triggers/new-opportunity';
import { newProjectTrigger } from '../src/lib/triggers/new-project';
import { capsuleCrmProps } from '../src/lib/common/props';
import { aiUpdateOpportunity } from '../src/lib/actions/ai/ai-update-opportunity';
import { aiUpdateParty } from '../src/lib/actions/ai/ai-update-party';
import { aiCreatePerson } from '../src/lib/actions/ai/ai-create-person';
import { aiSearchParties } from '../src/lib/actions/ai/ai-search-parties';
import { updateContactAction } from '../src/lib/actions/update-contact';
import { updateOpportunityAction } from '../src/lib/actions/update-opportunity';
import { createOpportunityAction } from '../src/lib/actions/create-opportunity';
import { createProjectAction } from '../src/lib/actions/create-project';
import { createTaskAction } from '../src/lib/actions/create-task';
import { createContactAction } from '../src/lib/actions/create-contact';

const auth = {
  access_token: 'token-1',
  type: 'OAUTH2',
  expires_in: 3600,
  claimed_at: 0,
  scope: 'read write',
  token_type: 'bearer',
  data: {},
  client_id: 'c',
  client_secret: 's',
  authorization_method: undefined,
  code_verifier: undefined,
  props: {},
  redirect_url: 'https://example.test/redirect',
  token_url: 'https://api.capsulecrm.com/oauth/token',
  grant_type: 'authorization_code',
  refresh_token: 'r',
};

const calls: HttpRequest[] = [];

function respondWith({ responses }: { responses: Array<{ status?: number; body: unknown; headers?: Record<string, string> }> }) {
  let index = 0;
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
    calls.push(request);
    const next = responses[Math.min(index, responses.length - 1)];
    index++;
    const status = next.status ?? 200;
    if (status >= 400) {
      throw new HttpError(request.body, { status, responseBody: next.body });
    }
    return { status, body: next.body, headers: next.headers ?? {} };
  });
}

function runAction({ action, propsValue }: { action: { run: (ctx: never) => Promise<unknown> }; propsValue: Record<string, unknown> }) {
  const context: unknown = { auth, propsValue };
  return Reflect.apply(action.run, action, [context]);
}

beforeEach(() => {
  calls.length = 0;
  vi.restoreAllMocks();
});

describe('capsule-crm client', () => {
  it('createContact unwraps party and sends jobTitle', async () => {
    respondWith({ responses: [{ status: 201, body: { party: { id: 11, type: 'person' } } }] });
    const party = await capsuleCrmClient.createContact({ auth, params: { type: 'person', firstName: 'A', lastName: 'B', jobTitle: 'CTO' } });
    expect(party.id).toBe(11);
    expect(calls[0].method).toBe(HttpMethod.POST);
    expect(calls[0].url).toBe('https://api.capsulecrm.com/api/v2/parties');
    expect(calls[0].body).toEqual({ party: { type: 'person', firstName: 'A', lastName: 'B', jobTitle: 'CTO' } });
  });

  it('updateContact sends jobTitle, not title, and unwraps', async () => {
    respondWith({ responses: [{ body: { party: { id: 5, type: 'person' } } }] });
    const party = await capsuleCrmClient.updateContact({ auth, partyId: 5, params: { jobTitle: 'Dev' } });
    expect(party.id).toBe(5);
    expect(calls[0].method).toBe(HttpMethod.PUT);
    expect(calls[0].body).toEqual({ party: { jobTitle: 'Dev' } });
  });

  it('follows Link rel=next and stops when absent', async () => {
    respondWith({
      responses: [
        { body: { users: [{ id: 1 }] }, headers: { link: '<https://api.capsulecrm.com/api/v2/users?page=2>; rel="next"' } },
        { body: { users: [{ id: 2 }] } },
      ],
    });
    const users = await capsuleCrmClient.listUsers({ auth });
    expect(users.map((user) => user.id)).toEqual([1, 2]);
    expect(calls).toHaveLength(2);
    expect(calls[1].queryParams).toMatchObject({ page: '2', perPage: '100' });
  });

  it('caps dropdown pagination at 10 pages', async () => {
    respondWith({ responses: [{ body: { users: [{ id: 1 }] }, headers: { link: '<x>; rel="next"' } }] });
    await capsuleCrmClient.listUsers({ auth });
    expect(calls).toHaveLength(10);
  });

  it('maps 422 errors[] into the message without status+body fields', async () => {
    respondWith({ responses: [{ status: 422, body: { message: 'Validation failed', errors: [{ message: 'is required', field: 'name' }] } }] });
    const error = await capsuleCrmClient.createProject({ auth, params: { party: { id: 1 }, name: '' } }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).toContain('Capsule CRM create project failed (422): Validation failed; name: is required');
    expect(error).not.toHaveProperty('status');
    expect(error).not.toHaveProperty('body');
  });

  it('maps 429 error text', async () => {
    respondWith({ responses: [{ status: 429, body: { error: 'rate limit reached' } }] });
    await expect(capsuleCrmClient.listStages({ auth })).rejects.toThrow('(429): rate limit reached');
  });

  it('unsubscribe treats 404 as already gone', async () => {
    respondWith({ responses: [{ status: 404, body: { message: 'not found' } }] });
    await expect(capsuleCrmClient.unsubscribeRestHook({ auth, hookId: 9 })).resolves.toBeUndefined();
  });

  it('subscribe posts restHook wrapper', async () => {
    respondWith({ responses: [{ status: 201, body: { restHook: { id: 3, event: 'kase/created', targetUrl: 'u' } } }] });
    const hook = await capsuleCrmClient.subscribeRestHook({ auth, params: { event: 'kase/created', targetUrl: 'u', description: 'd' } });
    expect(hook.id).toBe(3);
    expect(calls[0].body).toEqual({ restHook: { event: 'kase/created', targetUrl: 'u', description: 'd' } });
  });

  it('rejects non-numeric IDs before any request', async () => {
    respondWith({ responses: [{ body: {} }] });
    await expect(capsuleCrmClient.getParty({ auth, partyId: '../users' })).rejects.toThrow('positive whole numbers');
    expect(calls).toHaveLength(0);
  });
});

describe('capsule-crm ai actions', () => {
  it('ai_create_task rejects more than one link', async () => {
    respondWith({ responses: [{ body: {} }] });
    await expect(runAction({ action: aiCreateTask, propsValue: { description: 'x', due_on: '2026-12-01', party_id: '1', project_id: '2' } })).rejects.toThrow('only one');
    expect(calls).toHaveLength(0);
  });

  it('ai_create_task sends kase link and unwraps task', async () => {
    respondWith({ responses: [{ status: 201, body: { task: { id: 7 } } }] });
    const task = await runAction({ action: aiCreateTask, propsValue: { description: 'x', due_on: '2026-12-01', due_time: '09:30', project_id: '42' } });
    expect(task).toEqual({ id: 7 });
    expect(calls[0].body).toEqual({ task: { description: 'x', dueOn: '2026-12-01', dueTime: '09:30:00', kase: { id: 42 } } });
  });

  it('ai_add_note requires exactly one link and uses kase key', async () => {
    respondWith({ responses: [{ status: 201, body: { entry: { id: 8 } } }] });
    await expect(runAction({ action: aiAddNote, propsValue: { content: 'hi' } })).rejects.toThrow('Give one of');
    const entry = await runAction({ action: aiAddNote, propsValue: { content: 'hi', project_id: '3' } });
    expect(entry).toEqual({ id: 8 });
    expect(calls[0].url).toBe('https://api.capsulecrm.com/api/v2/entries');
    expect(calls[0].body).toEqual({ entry: { type: 'note', content: 'hi', kase: { id: 3 } } });
  });

  it('ai_search_projects uses /kases/search with q', async () => {
    respondWith({ responses: [{ body: { kases: [{ id: 1, name: 'P' }] } }] });
    const result = await runAction({ action: aiSearchProjects, propsValue: { query: 'P' } });
    expect(calls[0].url).toBe('https://api.capsulecrm.com/api/v2/kases/search');
    expect(calls[0].queryParams).toMatchObject({ q: 'P', page: '1', perPage: '50' });
    expect(result).toEqual({ projects: [{ id: 1, name: 'P' }], page: 1, hasMore: false });
  });

  it('ai_create_opportunity requires amount and currency together', async () => {
    respondWith({ responses: [{ body: {} }] });
    await expect(runAction({ action: aiCreateOpportunity, propsValue: { party_id: '1', milestone_id: '2', name: 'D', amount: 10 } })).rejects.toThrow('together');
    expect(calls).toHaveLength(0);
  });
});

describe('capsule-crm piece metadata', () => {
  it('has outputSchema everywhere and no duplicate agent tools', () => {
    const actions = Object.values(capsuleCrm.actions());
    const triggers = Object.values(capsuleCrm.triggers());
    expect(actions).toHaveLength(31);
    for (const item of [...actions, ...triggers]) {
      expect(item.outputSchema, item.name).toBeDefined();
    }
    expect(actions.filter((action) => action.audience === 'ai')).toHaveLength(21);
    expect(actions.filter((action) => action.audience === 'both')).toHaveLength(0);
    expect(capsuleCrm.minimumSupportedRelease).toBe('0.86.4');
  });
});

describe('capsule-crm edge cases', () => {
  it('treats stringified empty objects as empty text and tags', async () => {
    respondWith({ responses: [{ body: { opportunity: { id: 1 } } }] });
    await expect(runAction({ action: aiUpdateOpportunity, propsValue: { opportunity_id: '1', description: '{}', name: ' [] ' } })).rejects.toThrow('at least one field');
    expect(capsuleCrmClient.splitList('[]')).toEqual([]);
    expect(capsuleCrmClient.optionalText('[]')).toBeUndefined();
    respondWith({ responses: [{ body: { party: { id: 2 } } }] });
    await runAction({ action: aiUpdateParty, propsValue: { party_id: '2', about: '{}', add_tags: '[]', job_title: 'CTO' } });
    expect(calls.at(-1)?.body).toEqual({ party: { jobTitle: 'CTO' } });
  });

  it('ai_update_party with nothing to change errors', async () => {
    respondWith({ responses: [{ body: {} }] });
    await expect(runAction({ action: aiUpdateParty, propsValue: { party_id: '2' } })).rejects.toThrow('at least one field');
    expect(calls).toHaveLength(0);
  });

  it('isoDate rejects rollover and trailing text', () => {
    expect(() => capsuleCrmClient.isoDate({ value: '2026-02-30', label: 'D' })).toThrow('real date');
    expect(() => capsuleCrmClient.isoDate({ value: '2026-12-31garbage', label: 'D' })).toThrow('real date');
    expect(capsuleCrmClient.isoDate({ value: '2028-02-29', label: 'D' })).toBe('2028-02-29');
    expect(capsuleCrmClient.dayFromDateTime({ value: '2026-12-31T10:00:00.000Z', label: 'D' })).toBe('2026-12-31');
    expect(() => capsuleCrmClient.dayFromDateTime({ value: '2026-13-40', label: 'D' })).toThrow('real date');
  });

  it('ai_create_task rejects out-of-range times', async () => {
    respondWith({ responses: [{ body: {} }] });
    await expect(runAction({ action: aiCreateTask, propsValue: { description: 'x', due_on: '2026-12-01', due_time: '25:99' } })).rejects.toThrow('24-hour');
    await expect(runAction({ action: aiCreateTask, propsValue: { description: 'x', due_on: '2026-12-01', due_time: '23:60' } })).rejects.toThrow('24-hour');
    expect(calls).toHaveLength(0);
  });

  it('ai create actions report missing required text clearly', async () => {
    respondWith({ responses: [{ body: {} }] });
    await expect(runAction({ action: aiCreatePerson, propsValue: { last_name: 'B' } })).rejects.toThrow('First Name is required.');
    await expect(runAction({ action: aiAddNote, propsValue: { project_id: '1' } })).rejects.toThrow('Content is required.');
    expect(calls).toHaveLength(0);
  });

  it('ai_search_parties sends no type filter and returns both types', async () => {
    respondWith({ responses: [{ body: { parties: [{ id: 1, type: 'person' }, { id: 2, type: 'organisation' }] } }] });
    const result = await runAction({ action: aiSearchParties, propsValue: { query: 'acme' } });
    expect(calls[0].url).toBe('https://api.capsulecrm.com/api/v2/parties/search');
    expect(Object.keys(calls[0].queryParams ?? {}).sort()).toEqual(['embed', 'page', 'perPage', 'q']);
    expect(result).toEqual({ parties: [{ id: 1, type: 'person' }, { id: 2, type: 'organisation' }], page: 1, hasMore: false });
  });

  it('adds a hint on 500 from create party', async () => {
    respondWith({ responses: [{ status: 500, body: 'Internal Server Error' }] });
    await expect(capsuleCrmClient.createContact({ auth, params: { type: 'organisation', name: 'X' } })).rejects.toThrow('emoji');
  });

  it('human update_contact does not send blank about', async () => {
    respondWith({ responses: [{ body: { party: { id: 3 } } }] });
    await runAction({ action: updateContactAction, propsValue: { contact_id: 3, contactFields: { title: 'Dev' }, about: '   ' } });
    expect(calls[0].body).toEqual({ party: { jobTitle: 'Dev' } });
  });

  it('human update_opportunity does not send blank name/description', async () => {
    respondWith({ responses: [{ body: { opportunity: { id: 4 } } }] });
    await runAction({ action: updateOpportunityAction, propsValue: { opportunityId: 4, name: '  ', description: '  ', probability: 10 } });
    expect(calls[0].body).toEqual({ opportunity: { probability: 10 } });
  });

  it('human create_opportunity keeps amount 0', async () => {
    respondWith({ responses: [{ status: 201, body: { opportunity: { id: 5 } } }] });
    await runAction({ action: createOpportunityAction, propsValue: { partyId: 1, milestoneId: 2, name: 'D', amount: 0, currency: 'USD' } });
    expect(calls[0].body).toMatchObject({ opportunity: { value: { amount: 0, currency: 'USD' } } });
  });

  it('human create_project rejects impossible expected close date', async () => {
    respondWith({ responses: [{ body: {} }] });
    await expect(runAction({ action: createProjectAction, propsValue: { partyId: 1, name: 'P', expectedCloseOn: '2026-13-40' } })).rejects.toThrow('Expected Close Date');
    expect(calls).toHaveLength(0);
  });

  it('human create_task rejects an invalid linked id', async () => {
    respondWith({ responses: [{ body: {} }] });
    await expect(runAction({ action: createTaskAction, propsValue: { description: 'x', dueOn: '2026-12-01T00:00:00.000Z', linkTo: 'party', linkedEntityId: { partyId: 'abc' } } })).rejects.toThrow('Party ID must be a numeric');
    expect(calls).toHaveLength(0);
  });

  it('human create_contact rejects an invalid organisation id', async () => {
    respondWith({ responses: [{ body: {} }] });
    await expect(runAction({ action: createContactAction, propsValue: { type: 'person', contactFields: { firstName: 'A', lastName: 'B', organisationId: 'abc' } } })).rejects.toThrow('Organisation must be a numeric');
    expect(calls).toHaveLength(0);
  });
});

describe('capsule-crm required ids', () => {
  it('reports missing required IDs by label', async () => {
    respondWith({ responses: [{ body: {} }] });
    await expect(runAction({ action: aiCreateProject, propsValue: { name: 'P' } })).rejects.toThrow('Party ID is required.');
    await expect(runAction({ action: aiCreateOpportunity, propsValue: { party_id: '1', name: 'D' } })).rejects.toThrow('Milestone ID is required.');
    await expect(runAction({ action: aiAddNote, propsValue: { content: 'x', party_id: '' } })).rejects.toThrow('Give one of Party ID');
    expect(calls).toHaveLength(0);
  });
});

function memoryStore({ failPut }: { failPut: boolean }) {
  const data = new Map<string, unknown>();
  return {
    data,
    put: async (key: string, value: unknown) => {
      if (failPut) {
        throw new Error('store down');
      }
      data.set(key, value);
      return value;
    },
    get: async (key: string) => data.get(key) ?? null,
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

function callHook({ hook, context }: { hook: unknown; context: unknown }) {
  if (typeof hook !== 'function') {
    throw new Error('hook missing');
  }
  return Reflect.apply(hook, undefined, [context]);
}

describe('capsule-crm preflight follow-ups', () => {
  it('ai_delete_party maps 202 to async and 204 to completed', async () => {
    respondWith({ responses: [{ status: 202, body: '' }] });
    expect(await runAction({ action: aiDeleteParty, propsValue: { party_id: '9' } })).toEqual({ id: 9, accepted: true, completed: false, async: true, httpStatus: 202 });
    expect(calls[0].method).toBe(HttpMethod.DELETE);
    respondWith({ responses: [{ status: 204, body: '' }] });
    expect(await runAction({ action: aiDeleteParty, propsValue: { party_id: '9' } })).toMatchObject({ completed: true, async: false });
  });

  it('ai_complete_task PUTs status COMPLETED', async () => {
    respondWith({ responses: [{ body: { task: { id: 4, status: 'COMPLETED' } } }] });
    expect(await runAction({ action: aiCompleteTask, propsValue: { task_id: '4' } })).toEqual({ id: 4, status: 'COMPLETED' });
    expect(calls[0].method).toBe(HttpMethod.PUT);
    expect(calls[0].url).toBe('https://api.capsulecrm.com/api/v2/tasks/4');
    expect(calls[0].body).toEqual({ task: { status: 'COMPLETED' } });
  });

  it('ai_update_opportunity refuses an empty update', async () => {
    respondWith({ responses: [{ body: {} }] });
    await expect(runAction({ action: aiUpdateOpportunity, propsValue: { opportunity_id: '1' } })).rejects.toThrow('at least one field');
    expect(calls).toHaveLength(0);
  });

  it('ai_list_entries maps project to kases path and caps per page at 50', async () => {
    respondWith({ responses: [{ body: { entries: [{ id: 1 }] } }] });
    const result = await runAction({ action: aiListEntries, propsValue: { entity_type: 'project', entity_id: '6' } });
    expect(calls[0].url).toBe('https://api.capsulecrm.com/api/v2/kases/6/entries');
    expect(result).toEqual({ entries: [{ id: 1 }], page: 1, hasMore: false });
    await expect(runAction({ action: aiListEntries, propsValue: { entity_type: 'party', entity_id: '6', per_page: 51 } })).rejects.toThrow('between 1 and 50');
  });

  it('ai_list_tasks defaults status to open', async () => {
    respondWith({ responses: [{ body: { tasks: [] } }] });
    await runAction({ action: aiListTasks, propsValue: {} });
    expect(calls[0].queryParams).toMatchObject({ status: 'open', page: '1', perPage: '50' });
  });

  it('ai_get_opportunity embeds tags and fields; ai_search_opportunities hits /search', async () => {
    respondWith({ responses: [{ body: { opportunity: { id: 3 } } }] });
    expect(await runAction({ action: aiGetOpportunity, propsValue: { opportunity_id: '3' } })).toEqual({ id: 3 });
    expect(calls[0].queryParams).toMatchObject({ embed: 'tags,fields' });
    respondWith({ responses: [{ body: { opportunities: [{ id: 3 }] }, headers: { link: '<x>; rel="next"' } }] });
    expect(await runAction({ action: aiSearchOpportunities, propsValue: { query: 'deal', page: '2' } })).toEqual({ opportunities: [{ id: 3 }], page: 2, hasMore: true });
    expect(calls[1].url).toBe('https://api.capsulecrm.com/api/v2/opportunities/search');
  });

  it('find_contact follows pages; find_project POSTs filter with paging', async () => {
    respondWith({ responses: [
      { body: { parties: [{ id: 1, type: 'person' }] }, headers: { link: '<x>; rel="next"' } },
      { body: { parties: [{ id: 2, type: 'person' }, { id: 3, type: 'organisation' }] } },
    ] });
    expect(await runAction({ action: findContactAction, propsValue: { term: 'a' } })).toEqual([{ id: 1, type: 'person' }, { id: 2, type: 'person' }]);
    expect(calls).toHaveLength(2);
    respondWith({ responses: [{ body: { kases: [{ id: 5 }] } }] });
    const filter = { conditions: [{ field: 'name', operator: 'is', value: 'x' }] };
    expect(await runAction({ action: findProjectAction, propsValue: { filter } })).toEqual([{ id: 5 }]);
    expect(calls[2].method).toBe(HttpMethod.POST);
    expect(calls[2].body).toEqual({ filter });
    expect(calls[2].queryParams).toMatchObject({ page: '1', perPage: '100' });
  });

  it('human update_opportunity keeps amount 0 and drops blank tag names', async () => {
    respondWith({ responses: [{ body: { opportunity: { id: 4 } } }] });
    await runAction({ action: updateOpportunityAction, propsValue: { opportunityId: 4, amount: 0, currency: 'USD', tags: { tags: [{ id: 7, name: '' }, { name: 'New' }] } } });
    expect(calls[0].body).toEqual({ opportunity: { value: { currency: 'USD', amount: 0 }, tags: [{ id: 7 }, { name: 'New' }] } });
  });

  it('client edge nits', () => {
    expect(() => capsuleCrmClient.segment('0')).toThrow('positive whole numbers');
    expect(() => capsuleCrmClient.segment('9007199254740993')).toThrow('positive whole numbers');
    expect(capsuleCrmClient.dayFromDateTime({ value: '2026-12-31 09:30', label: 'D' })).toBe('2026-12-31');
    expect(() => capsuleCrmClient.dayFromDateTime({ value: '2026-12-31T99:99', label: 'D' })).toThrow('valid date-time');
    expect(capsuleCrmClient.pageArgs({ page: '3', perPage: '20' })).toEqual({ page: 3, perPage: 20 });
    expect(capsuleCrmClient.optionalText('null')).toBe('null');
    expect(capsuleCrmClient.optionalText(' {} ')).toBeUndefined();
  });

  it('human create actions do not send whitespace-only text', async () => {
    respondWith({ responses: [{ status: 201, body: { kase: { id: 1 } } }] });
    await runAction({ action: createProjectAction, propsValue: { partyId: 1, name: 'P', description: '   ' } });
    expect(calls[0].body).toEqual({ kase: { party: { id: 1 }, name: 'P' } });
  });

  it('create_opportunity custom fields return {} without auth', async () => {
    const props = createOpportunityAction.props['customFields'];
    const result = await callHook({ hook: Reflect.get(props, 'props'), context: { auth: undefined } });
    expect(result).toEqual({});
  });

  it('contact dropdown searches and flags truncation', async () => {
    const dropdown = capsuleCrmProps.contact_id();
    expect(dropdown.refreshOnSearch).toBe(true);
    respondWith({ responses: [{ body: { parties: [{ id: 1, type: 'organisation', name: 'Acme' }] }, headers: { link: '<x>; rel="next"' } }] });
    const result = await callHook({ hook: dropdown.options, context: { auth, searchValue: 'acme' } });
    expect(calls[0].url).toBe('https://api.capsulecrm.com/api/v2/parties/search');
    expect(calls).toHaveLength(10);
    expect(result).toMatchObject({ placeholder: 'Showing the first 1,000, type to search' });
  });
});

describe('capsule-crm trigger lifecycle', () => {
  it('sampleData is the bare record for every trigger', () => {
    for (const trigger of [newTaskTrigger, newCaseTrigger, newOpportunityTrigger, newProjectTrigger]) {
      expect(trigger.sampleData).toHaveProperty('id');
      expect(trigger.sampleData).not.toHaveProperty('payload');
      expect(trigger.description).toContain('at most 20 webhooks');
    }
  });

  it('onEnable cleans up the hook and rethrows the original error when store.put fails', async () => {
    respondWith({ responses: [{ status: 201, body: { restHook: { id: 31 } } }, { status: 500, body: 'boom' }] });
    const store = memoryStore({ failPut: true });
    await expect(callHook({ hook: newTaskTrigger.onEnable, context: { auth, webhookUrl: 'https://hook.test', store } })).rejects.toThrow('store down');
    expect(calls[1].method).toBe(HttpMethod.DELETE);
    expect(calls[1].url).toBe('https://api.capsulecrm.com/api/v2/resthooks/31');
  });

  it('onDisable deletes the hook and clears the store', async () => {
    respondWith({ responses: [{ status: 201, body: { restHook: { id: 32 } } }, { status: 204, body: '' }] });
    const store = memoryStore({ failPut: false });
    await callHook({ hook: newTaskTrigger.onEnable, context: { auth, webhookUrl: 'https://hook.test', store } });
    expect(store.data.size).toBe(1);
    await callHook({ hook: newTaskTrigger.onDisable, context: { auth, store } });
    expect(calls[1].method).toBe(HttpMethod.DELETE);
    expect(store.data.size).toBe(0);
  });

  it('run returns payload records and [] for malformed bodies', async () => {
    expect(await callHook({ hook: newTaskTrigger.run, context: { payload: { body: { event: 'task/created', payload: [{ id: 1 }] } } } })).toEqual([{ id: 1 }]);
    expect(await callHook({ hook: newTaskTrigger.run, context: { payload: { body: { event: 'ping' } } } })).toEqual([]);
    expect(await callHook({ hook: newTaskTrigger.run, context: { payload: { body: 'x' } } })).toEqual([]);
  });
});

describe('opportunity value on the human actions', () => {
  it('rejects an amount without a currency and keeps 0', async () => {
    const { capsuleCrmClient } = await import('../src/lib/common/client');
    expect(() => capsuleCrmClient.opportunityValue({ amount: 5000, currency: '' })).toThrow('Give Amount and Currency together.');
    expect(() => capsuleCrmClient.opportunityValue({ amount: undefined, currency: 'USD' })).toThrow('Give Amount and Currency together.');
    expect(capsuleCrmClient.opportunityValue({ amount: 0, currency: 'usd' })).toEqual({ amount: 0, currency: 'USD' });
    expect(capsuleCrmClient.opportunityValue({ amount: undefined, currency: undefined })).toBeUndefined();
  });
});

describe('update contact ignores agent placeholder text', () => {
  it('drops {} and [] in text fields', async () => {
    const { capsuleCrmClient } = await import('../src/lib/common/client');
    expect(capsuleCrmClient.optionalText('{}')).toBeUndefined();
    expect(capsuleCrmClient.optionalText('[]')).toBeUndefined();
    expect(capsuleCrmClient.optionalText('  ')).toBeUndefined();
    expect(capsuleCrmClient.optionalText(' Notes ')).toBe('Notes');
  });
});

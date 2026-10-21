import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpError, runAction, serverContext } from './helpers';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) } };
});

import { createPersonAi } from '../src/lib/actions/ai/create-person-ai';
import { updatePersonAi } from '../src/lib/actions/ai/update-person-ai';
import { updateCompanyAi } from '../src/lib/actions/ai/update-company-ai';
import { searchPeople } from '../src/lib/actions/ai/search-people';
import { deletePerson } from '../src/lib/actions/ai/delete-person';
import { updateTask } from '../src/lib/actions/ai/update-task';
import { createNote } from '../src/lib/actions/ai/create-note';
import { listTasks } from '../src/lib/actions/ai/list-tasks';
import { updateCompany } from '../src/lib/actions/update-company';
import { findPerson } from '../src/lib/actions/find-person';
import { findCompany } from '../src/lib/actions/find-company';
import { folkAuth } from '../src/lib/common/auth';
import { deleteGroupObject } from '../src/lib/actions/ai/delete-group-object';
import { createGroupObject } from '../src/lib/actions/ai/create-group-object';
import { folkCustomApiCall } from '../src/lib/actions/custom-api-call';

const GRP = 'grp_0a873e70-8534-40e7-a275-1a187381118f';
const PER = 'per_b8ecc039-a7b2-4d4d-bf1d-7fa3d2eabdfe';

function ok(body: unknown) {
  return { status: 200, headers: {}, body };
}

function call(index = 0) {
  return sendRequest.mock.calls[index][0];
}

beforeEach(() => {
  sendRequest.mockReset();
});

describe('create_person_ai', () => {
  it('sends the exact body, trimmed auth and the idempotency key', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { id: PER } }));
    const result = await runAction({
      action: createPersonAi,
      propsValue: {
        firstName: ' Ada ',
        emails: ['ada@example.com'],
        companyIds: ['com_1'],
        companyNames: ['Acme'],
        customFieldValues: { [GRP]: { Status: 'Lead' } },
        idempotencyKey: 'k-1',
      },
    });
    expect(result).toEqual({ id: PER });
    const req = call();
    expect(req.method).toBe('POST');
    expect(req.url).toBe('https://api.folk.app/v1/people');
    expect(req.headers.Authorization).toBe('Bearer folk_key');
    expect(req.headers['Idempotency-Key']).toBe('k-1');
    expect(req.body).toEqual({
      firstName: 'Ada',
      emails: ['ada@example.com'],
      companies: [{ id: 'com_1' }, { name: 'Acme' }],
      groups: [{ id: GRP }],
      customFieldValues: { [GRP]: { Status: 'Lead' } },
    });
  });

  it('refuses a person with no name or email before any request', async () => {
    await expect(runAction({ action: createPersonAi, propsValue: { jobTitle: 'CTO' } })).rejects.toThrow(/at least a first name/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('rejects custom fields not keyed by group ID', async () => {
    await expect(
      runAction({ action: createPersonAi, propsValue: { fullName: 'A', customFieldValues: { Status: 'x' } } })
    ).rejects.toThrow(/keyed by group ID/);
  });
});

describe('update_person_ai three-state', () => {
  it('omits untouched fields, clears listed fields and sets given ones', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { id: PER } }));
    await runAction({
      action: updatePersonAi,
      propsValue: { personId: PER, jobTitle: 'CEO', emails: [], clearFields: ['birthday', 'gender', 'phones'] },
    });
    const req = call();
    expect(req.method).toBe('PATCH');
    expect(req.url).toBe(`https://api.folk.app/v1/people/${PER}`);
    expect(req.body).toEqual({ jobTitle: 'CEO', birthday: '', gender: null, phones: [] });
  });

  it('keeps existing groups when only custom field values are given', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: { id: PER, groups: [{ id: 'grp_other' }] } }))
      .mockResolvedValueOnce(ok({ data: { id: PER } }));
    await runAction({ action: updatePersonAi, propsValue: { personId: PER, customFieldValues: { [GRP]: { Status: 'Won' } } } });
    expect(call(0).method).toBe('GET');
    expect(call(1).body).toEqual({ groups: [{ id: 'grp_other' }, { id: GRP }], customFieldValues: { [GRP]: { Status: 'Won' } } });
  });

  it('refuses an empty update and a bad ID', async () => {
    await expect(runAction({ action: updatePersonAi, propsValue: { personId: PER } })).rejects.toThrow(/Nothing to update/);
    await expect(runAction({ action: updatePersonAi, propsValue: { personId: '../webhooks', jobTitle: 'x' } })).rejects.toThrow(/not a valid Folk ID/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('only offers list fields in company Clear Fields', async () => {
    await expect(
      runAction({ action: updateCompanyAi, propsValue: { companyId: 'com_1', clearFields: ['industry'] } })
    ).rejects.toThrow(/Clear Fields can only contain/);
  });
});

describe('legacy Update Company', () => {
  it('does not wipe contact lists when the builder passes empty arrays', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'com_1' } }));
    const result = await runAction({
      action: updateCompany,
      propsValue: { companyId: 'com_1', industry: 'SaaS', emails: [], addresses: [], phones: [], urls: [] },
    });
    expect(call().body).toEqual({ industry: 'SaaS' });
    expect(result).toEqual({ company: { id: 'com_1' }, success: true });
  });
});

describe('search and pagination', () => {
  it('encodes filters with a combinator and extracts the cursor from nextLink', async () => {
    sendRequest.mockResolvedValueOnce(
      ok({ data: { items: [{ id: PER }], pagination: { nextLink: 'https://api.folk.app/v1/people?limit=1&cursor=abc%3D' } } })
    );
    const result = await runAction({
      action: searchPeople,
      propsValue: {
        email: '@acme.com',
        groupId: GRP,
        extraFilters: [{ field: `customFieldValues.${GRP}.Status`, operator: 'in', value: 'Lead' }],
        limit: 1,
      },
    });
    expect(call().queryParams).toEqual({
      'filter[emails][like]': '@acme.com',
      'filter[groups][in][id]': GRP,
      [`filter[customFieldValues.${GRP}.Status][in]`]: 'Lead',
      combinator: 'and',
      limit: '1',
    });
    expect(result).toEqual({ items: [{ id: PER }], count: 1, hasMore: true, nextCursor: 'abc=' });
  });

  it('validates limit and bad filter operators', async () => {
    await expect(runAction({ action: searchPeople, propsValue: { limit: 500 } })).rejects.toThrow(/1 to 100/);
    await expect(
      runAction({ action: searchPeople, propsValue: { extraFilters: [{ field: 'x', operator: 'drop', value: '1' }] } })
    ).rejects.toThrow(/operator/);
  });

  it('legacy List People accepts a full nextLink as cursor and keeps the old output', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [], pagination: {} } }));
    const result = await runAction({
      action: findPerson,
      propsValue: { cursor: 'https://api.folk.app/v1/people?cursor=xyz', limit: 20 },
    });
    expect(call().queryParams).toEqual({ limit: '20', cursor: 'xyz' });
    expect(result).toEqual({ data: { items: [], pagination: {} }, hasMore: false, nextCursor: null, success: true });
  });

  it('legacy Find Company filters by name only', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [{ id: 'com_1' }], pagination: {} } }));
    const result = await runAction({ action: findCompany, propsValue: { query: 'Acme' } });
    expect(call().queryParams).toEqual({ 'filter[name][like]': 'Acme', limit: '100' });
    expect(result).toMatchObject({ companies: [{ id: 'com_1' }], count: 1, hasMore: false, nextCursor: null });
  });

  it('list_tasks maps status and only-mine', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { items: [], pagination: {} } }));
    await runAction({ action: listTasks, propsValue: { status: 'open', onlyMine: true, entityId: PER } });
    expect(call().queryParams).toEqual({
      'filter[entity][in]': PER,
      'filter[completedAt][empty]': '',
      combinator: 'and',
      onlyAssignedToMe: 'true',
      limit: '20',
    });
  });
});

describe('tasks, notes, deletes', () => {
  it('update_task patches then marks done', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'tsk_1' } })).mockResolvedValueOnce(ok({ data: { id: 'tsk_1', completedAt: 'x' } }));
    const result = await runAction({
      action: updateTask,
      propsValue: { taskId: 'tsk_1', title: 'T', clearDueTime: true, status: 'done', completedAt: '2026-10-21T10:00:00Z' },
    });
    expect(call(0).body).toEqual({ title: 'T', dueTime: null });
    expect(call(1).url).toBe('https://api.folk.app/v1/tasks/tsk_1/mark-as-done');
    expect(call(1).body).toEqual({ completedAt: '2026-10-21T10:00:00.000Z' });
    expect(result).toEqual({ id: 'tsk_1', completedAt: 'x' });
  });

  it('create_note defaults to public and checks the record ID', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'nte_1' } }));
    await runAction({ action: createNote, propsValue: { entityId: PER, content: 'hi' } });
    expect(call().body).toEqual({ entity: { id: PER }, content: 'hi', visibility: 'public' });
    await expect(runAction({ action: createNote, propsValue: { entityId: 'usr_1', content: 'hi' } })).rejects.toThrow(/person/);
  });

  it('delete_person sends DELETE with no body and returns the ID', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { id: PER } }));
    const result = await runAction({ action: deletePerson, propsValue: { personId: PER } });
    expect(call().method).toBe('DELETE');
    expect(call().body).toBeUndefined();
    expect(result).toEqual({ deleted: true, id: PER });
  });
});

describe('group objects', () => {
  it('create encodes the object type and sends links plus fields', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'obj_1' } }));
    await runAction({
      action: createGroupObject,
      propsValue: { groupId: GRP, objectType: 'Object 1', name: 'Deal', personIds: [PER], customFieldValues: { Status: 'Lead' } },
    });
    expect(call().url).toBe(`https://api.folk.app/v1/groups/${GRP}/Object%201`);
    expect(call().body).toEqual({ name: 'Deal', people: [{ id: PER }], customFieldValues: { Status: 'Lead' } });
  });

  it('delete sends DELETE to the object path', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'obj_1' } }));
    const result = await runAction({ action: deleteGroupObject, propsValue: { groupId: GRP, objectType: 'Object', objectId: 'obj_1' } });
    expect(call().method).toBe('DELETE');
    expect(call().url).toBe(`https://api.folk.app/v1/groups/${GRP}/Object/obj_1`);
    expect(result).toEqual({ deleted: true, id: 'obj_1' });
  });
});

describe('TLS and custom API call', () => {
  it('sends every request with a certificate-checking dispatcher', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { id: PER } }));
    await runAction({ action: deletePerson, propsValue: { personId: PER } });
    const dispatcher = sendRequest.mock.calls[0][1].dispatcher;
    expect(dispatcher?.constructor?.name).toBe('Agent');
  });

  it('custom call adds the key for a relative path on api.folk.app', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { data: { id: 'usr_1' } } });
    const result = await runAction({ action: folkCustomApiCall, propsValue: { method: 'GET', url: { url: '/v1/users/me' } } });
    expect(call().url).toBe('https://api.folk.app/v1/users/me');
    expect(call().headers.Authorization).toBe('Bearer folk_key');
    expect(sendRequest.mock.calls[0][1].dispatcher).toBeDefined();
    expect(result).toEqual({ status: 200, headers: {}, body: { data: { id: 'usr_1' } } });
  });

  it('custom call refuses other hosts and dot segments', async () => {
    for (const url of ['https://api.folk.app.evil.io/v1', '//evil.io/x', 'https://user@api.folk.app/v1', '/v1/../../x']) {
      await expect(runAction({ action: folkCustomApiCall, propsValue: { method: 'GET', url: { url } } })).rejects.toThrow();
    }
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('errors', () => {
  it('surfaces the Folk message on 404', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 404, body: { error: { code: 'RESOURCE_NOT_FOUND', message: 'Person not found.' } } }));
    await expect(runAction({ action: deletePerson, propsValue: { personId: PER } })).rejects.toThrow(
      'Folk could not find that record (HTTP 404). Check the ID. Person not found.'
    );
  });

  it('retries a 429 using details.retryAfter, then succeeds', async () => {
    sendRequest
      .mockRejectedValueOnce(httpError({ status: 429, body: { error: { code: 'TOO_MANY_REQUESTS', details: { retryAfter: new Date(Date.now() + 10).toISOString() } } } }))
      .mockResolvedValueOnce(ok({ data: { id: PER } }));
    await expect(runAction({ action: deletePerson, propsValue: { personId: PER } })).resolves.toEqual({ deleted: true, id: PER });
    expect(sendRequest).toHaveBeenCalledTimes(2);
  });

  it('validate says invalid only on 401/403', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 401, body: {} }));
    const invalid = await folkAuth.validate?.({ auth: 'bad', server: serverContext() });
    expect(invalid).toEqual({ valid: false, error: expect.stringMatching(/Invalid API key/) });
    sendRequest.mockRejectedValueOnce(httpError({ status: 500, body: {} }));
    const down = await folkAuth.validate?.({ auth: 'k', server: serverContext() });
    expect(down).toEqual({ valid: false, error: expect.stringMatching(/Could not reach/) });
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 'usr_1' } }));
    expect(await folkAuth.validate?.({ auth: 'k', server: serverContext() })).toEqual({ valid: true });
    expect(call(2).url).toBe('https://api.folk.app/v1/users/me');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const request = vi.hoisted(() => vi.fn<() => Promise<unknown>>());
const resolveAuth = vi.hoisted(() => vi.fn<() => Promise<{ access_token: string }>>());

vi.mock('../../../src/lib/common/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/client')>();
  return { ...actual, GoogleWorkspaceApi: { ...actual.GoogleWorkspaceApi, request } };
});
vi.mock('../../../src/lib/common/token', () => ({ resolveAuth }));

const { addRecord } = await import('../../../src/lib/actions/add-record');
const { updateRecord } = await import('../../../src/lib/actions/update-record');
const { deleteRecord } = await import('../../../src/lib/actions/delete-record');

const AUTH = { type: 'OAUTH2', access_token: 'tok' };
const RESOLVED = { access_token: 'resolved' };

type Runnable = { run: (ctx: unknown) => Promise<unknown> };
const run = (action: Runnable, propsValue: Record<string, unknown>) => action.run({ auth: AUTH, propsValue });

beforeEach(() => {
  request.mockReset();
  resolveAuth.mockReset().mockResolvedValue(RESOLVED);
});

describe('addRecord', () => {
  it('should POST the JSON body to the collection and return the created record with its id', async () => {
    request.mockResolvedValue({ id: '1122', primaryEmail: 'jane@example.com' });
    const record = { primaryEmail: 'jane@example.com', name: { givenName: 'Jane', familyName: 'Doe' }, password: 'x' };

    const result = await run(addRecord, { resourceType: 'user', record });

    expect(request).toHaveBeenCalledWith({ auth: RESOLVED, method: 'POST', path: 'admin/directory/v1/users', body: record });
    expect(result).toEqual({ resourceType: 'user', id: '1122', record: { id: '1122', primaryEmail: 'jane@example.com' } });
  });

  it('should accept the record as a JSON string and scope members under the parent group', async () => {
    request.mockResolvedValue({ id: '9', email: 'jane@example.com', role: 'MEMBER' });

    await run(addRecord, { resourceType: 'group_member', parent: 'sales@example.com', record: '{"email":"jane@example.com","role":"MEMBER"}' });

    expect(request).toHaveBeenCalledWith({
      auth: RESOLVED,
      method: 'POST',
      path: 'admin/directory/v1/groups/sales%40example.com/members',
      body: { email: 'jane@example.com', role: 'MEMBER' },
    });
  });

  it('should refuse types the Directory API cannot create, before calling Google', async () => {
    await expect(run(addRecord, { resourceType: 'mobile_device', record: {} })).rejects.toThrow('Mobile device records do not support "create"');
    await expect(run(addRecord, { resourceType: 'user', record: '[1,2]' })).rejects.toThrow('must be a JSON object');
    expect(request).not.toHaveBeenCalled();
  });
});

describe('updateRecord', () => {
  it('should PATCH the item path with only the given fields', async () => {
    request.mockResolvedValue({ orgUnitId: 'id:abc', name: 'West', description: 'West coast' });

    const result = await run(updateRecord, { resourceType: 'org_unit', identifier: '/Sales/West', record: { description: 'West coast' } });

    expect(request).toHaveBeenCalledWith({
      auth: RESOLVED,
      method: 'PATCH',
      path: 'admin/directory/v1/customer/my_customer/orgunits/Sales%2FWest',
      body: { description: 'West coast' },
    });
    expect(result).toEqual({ resourceType: 'org_unit', id: 'id:abc', record: { orgUnitId: 'id:abc', name: 'West', description: 'West coast' } });
  });

  it('should refuse an empty record and types without update', async () => {
    await expect(run(updateRecord, { resourceType: 'user', identifier: 'jane@example.com', record: {} })).rejects.toThrow('no fields to update');
    await expect(run(updateRecord, { resourceType: 'mobile_device', identifier: 'x', record: { a: 1 } })).rejects.toThrow('do not support "update"');
    expect(request).not.toHaveBeenCalled();
  });
});

describe('deleteRecord', () => {
  it('should DELETE the item path and report the removal', async () => {
    request.mockResolvedValue(undefined);

    const result = await run(deleteRecord, { resourceType: 'group', identifier: ' sales@example.com ' });

    expect(request).toHaveBeenCalledWith({ auth: RESOLVED, method: 'DELETE', path: 'admin/directory/v1/groups/sales%40example.com' });
    expect(result).toEqual({ resourceType: 'group', id: 'sales@example.com', removed: true });
  });

  it('should refuse types without delete (Chrome OS devices)', async () => {
    await expect(run(deleteRecord, { resourceType: 'chromeos_device', identifier: 'dev-1' })).rejects.toThrow('do not support "delete"');
    expect(request).not.toHaveBeenCalled();
  });
});

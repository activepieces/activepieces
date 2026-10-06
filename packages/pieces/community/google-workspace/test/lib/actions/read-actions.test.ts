import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  request: vi.fn<() => Promise<unknown>>(),
  listPage: vi.fn<() => Promise<unknown>>(),
  listAll: vi.fn<() => Promise<unknown>>(),
}));
const resolveAuth = vi.hoisted(() => vi.fn<() => Promise<{ access_token: string }>>());

vi.mock('../../../src/lib/common/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/client')>();
  return { ...actual, GoogleWorkspaceApi: { ...actual.GoogleWorkspaceApi, ...api } };
});
vi.mock('../../../src/lib/common/token', () => ({ resolveAuth }));

const { getRecord } = await import('../../../src/lib/actions/get-record');
const { searchRecords } = await import('../../../src/lib/actions/search-records');

const AUTH = { type: 'OAUTH2', access_token: 'tok' };
const RESOLVED = { access_token: 'resolved' };
const ctx = (propsValue: Record<string, unknown>) => ({ auth: AUTH, propsValue }) as never;

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  resolveAuth.mockReset().mockResolvedValue(RESOLVED);
});

describe('getRecord', () => {
  it('should GET the item path of the type and return the record with its id', async () => {
    api.request.mockResolvedValue({ id: '1122', primaryEmail: 'jane@example.com' });

    const result = await getRecord.run(ctx({ resourceType: 'user', identifier: 'jane@example.com', params: { projection: 'full' } }));

    expect(resolveAuth).toHaveBeenCalledWith(AUTH);
    expect(api.request).toHaveBeenCalledWith({
      auth: RESOLVED,
      method: 'GET',
      path: 'admin/directory/v1/users/jane%40example.com',
      query: { projection: 'full' },
    });
    expect(result).toEqual({ resourceType: 'user', id: '1122', record: { id: '1122', primaryEmail: 'jane@example.com' } });
  });

  it('should scope a group member under the parent group', async () => {
    api.request.mockResolvedValue({ id: '9', email: 'jane@example.com', role: 'MEMBER' });

    await getRecord.run(ctx({ resourceType: 'group_member', identifier: 'jane@example.com', parent: 'sales@example.com' }));

    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({ auth: RESOLVED, path: 'admin/directory/v1/groups/sales%40example.com/members/jane%40example.com' })
    );
  });

  it('should fail before calling Google when the parent is missing', async () => {
    await expect(getRecord.run(ctx({ resourceType: 'group_member', identifier: 'jane@example.com' }))).rejects.toThrow('needs the parent record');
    expect(api.request).not.toHaveBeenCalled();
  });
});

describe('searchRecords', () => {
  it('should list one page of users under my_customer with the query and the page size capped by Google', async () => {
    api.listPage.mockResolvedValue({ items: [{ id: '1' }], nextPageToken: 'p2' });

    const result = await searchRecords.run(ctx({ resourceType: 'user', query: 'email:sales*', maxRows: 5000, params: { orderBy: 'email' } }));

    expect(api.listPage).toHaveBeenCalledWith({
      auth: RESOLVED,
      path: 'admin/directory/v1/users',
      itemsKey: 'users',
      query: {
        customer: 'my_customer',
        query: 'email:sales*',
        orderBy: 'email',
        maxResults: 500,
        pageToken: undefined,
      },
    });
    expect(result).toEqual({ resourceType: 'user', items: [{ id: '1' }], count: 1, nextPageToken: 'p2' });
  });

  it('should filter by domain instead of customer when a domain is given', async () => {
    api.listPage.mockResolvedValue({ items: [] });

    const result = await searchRecords.run(ctx({ resourceType: 'group', domain: 'example.com', pageToken: 'tok', maxRows: 50 }));

    expect(api.listPage).toHaveBeenCalledWith({
      auth: RESOLVED,
      path: 'admin/directory/v1/groups',
      itemsKey: 'groups',
      query: {
        domain: 'example.com',
        maxResults: 50,
        pageToken: 'tok',
      },
    });
    expect(result).toEqual({ resourceType: 'group', items: [], count: 0, nextPageToken: null });
  });

  it('should fetch every page up to Max Rows when asked', async () => {
    api.listAll.mockResolvedValue({ items: [{ id: '1' }, { id: '2' }], truncated: true });

    const result = await searchRecords.run(ctx({ resourceType: 'group_member', parent: 'sales@example.com', fetchAllPages: true, maxRows: 2 }));

    expect(api.listAll).toHaveBeenCalledWith({ auth: RESOLVED, path: 'admin/directory/v1/groups/sales%40example.com/members', itemsKey: 'members', query: { maxResults: 2 }, maxRows: 2 });
    expect(result).toEqual({ resourceType: 'group_member', items: [{ id: '1' }, { id: '2' }], count: 2, truncated: true });
  });

  it('should list org units without pagination parameters', async () => {
    api.listPage.mockResolvedValue({ items: [{ orgUnitPath: '/Sales' }] });

    await searchRecords.run(ctx({ resourceType: 'org_unit', params: { type: 'all' } }));

    expect(api.listPage).toHaveBeenCalledWith({
      auth: RESOLVED,
      path: 'admin/directory/v1/customer/my_customer/orgunits',
      itemsKey: 'organizationUnits',
      query: {
        type: 'all',
        pageToken: undefined,
      },
    });
  });

  it('should refuse a query on a collection without search and a domain outside users/groups', async () => {
    await expect(searchRecords.run(ctx({ resourceType: 'org_unit', query: 'name:Sales' }))).rejects.toThrow(
      'Organizational unit records cannot be filtered with a query; use the extra parameters (orgUnitPath, type) instead.'
    );
    await expect(searchRecords.run(ctx({ resourceType: 'mobile_device', domain: 'example.com' }))).rejects.toThrow('only applies to users and groups');
    expect(api.listPage).not.toHaveBeenCalled();
    expect(api.listAll).not.toHaveBeenCalled();
  });
});

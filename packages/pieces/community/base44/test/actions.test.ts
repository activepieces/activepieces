import { afterEach, describe, expect, it, vi } from 'vitest';

const handler = {
  list: vi.fn(),
  filter: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};
const createClient = vi.fn();

vi.mock('@base44/sdk', () => ({ createClient }));

import { createEntity } from '../src/lib/actions/create-entity';
import { findEntity } from '../src/lib/actions/find-entity';
import { findOrCreateEntity } from '../src/lib/actions/find-or-create-entity';
import { getEntityRecord } from '../src/lib/actions/get-entity-record';
import { updateEntityRecord } from '../src/lib/actions/update-entity-record';
import { deleteEntityRecord } from '../src/lib/actions/delete-entity-record';
import { listEntityRecords } from '../src/lib/actions/list-entity-records';
import { base44Auth } from '../src/lib/common/client';

function setupClient(): void {
  const entities = new Proxy({}, { get: () => handler });
  createClient.mockReturnValue({ entities, asServiceRole: { entities } });
}

function validate(auth: { appId: string; token?: string }): Promise<unknown> {
  const validateFn = base44Auth.validate;
  if (!validateFn) {
    throw new Error('auth has no validate');
  }
  return validateFn({ auth, server: { apiUrl: '', publicUrl: '' } });
}

function run({ action, propsValue, token = 'tok' }: { action: { run: unknown }; propsValue: Record<string, unknown>; token?: string }): Promise<unknown> {
  setupClient();
  const runFn = action.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(Reflect.apply(runFn, action, [{ propsValue, auth: { props: { appId: 'app1', token } } }]));
}

function vendorError({ status, message }: { status: number; message: string }): Error {
  return Object.assign(new Error(message), { status, data: { message } });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('base44 actions', () => {
  it('create returns the stored record', async () => {
    handler.create.mockResolvedValue({ id: 'r1', name: 'A' });
    const result = await run({ action: createEntity, propsValue: { entityType: 'Product', entityData: { name: 'A' } } });
    expect(handler.create).toHaveBeenCalledWith({ name: 'A' });
    expect(result).toEqual({ id: 'r1', name: 'A' });
  });

  it('find clamps limit and forwards sort', async () => {
    handler.filter.mockResolvedValue([{ id: 'r1' }]);
    const result = await run({ action: findEntity, propsValue: { entityType: 'Product', searchQuery: { name: 'A' }, sort: '-created_date', limit: 9999 } });
    expect(handler.filter).toHaveBeenCalledWith({ name: 'A' }, '-created_date', 500);
    expect(result).toEqual({ found: true, count: 1, results: [{ id: 'r1' }] });
  });

  it('find defaults limit to 50', async () => {
    handler.filter.mockResolvedValue([]);
    const result = await run({ action: findEntity, propsValue: { entityType: 'Product', searchQuery: {} } });
    expect(handler.filter).toHaveBeenCalledWith({}, undefined, 50);
    expect(result).toEqual({ found: false, count: 0, results: [] });
  });

  it('normalises offset-less timestamps to UTC and leaves zoned ones alone', async () => {
    handler.list.mockResolvedValue([{ id: 'a', created_date: '2026-11-01T12:56:20.141000', updated_date: '2026-11-01T12:56:20.141562Z', note: '2026-11-01T12:56:20' }]);
    const result = await run({ action: listEntityRecords, propsValue: { entityType: 'TestItem' } });
    expect(result).toEqual({
      count: 1,
      records: [{ id: 'a', created_date: '2026-11-01T12:56:20.141000Z', updated_date: '2026-11-01T12:56:20.141562Z', note: '2026-11-01T12:56:20' }],
    });
  });

  it('find or create creates when nothing matches', async () => {
    handler.filter.mockResolvedValue([]);
    handler.create.mockResolvedValue({ id: 'new' });
    const result = await run({ action: findOrCreateEntity, propsValue: { entityType: 'Product', searchQuery: { a: 1 }, createData: { a: 1 } } });
    expect(result).toEqual({ found: false, created: true, entity: { id: 'new' } });
  });

  it('find or create rejects an array query before calling the API', async () => {
    await expect(
      run({ action: findOrCreateEntity, propsValue: { entityType: 'Product', searchQuery: [{ name: 'A' }], createData: { name: 'A' } } }),
    ).rejects.toThrow('Search Query must be a JSON object');
    expect(createClient).not.toHaveBeenCalled();
    expect(handler.filter).not.toHaveBeenCalled();
    expect(handler.create).not.toHaveBeenCalled();
  });

  it('create rejects a non-object entity data before calling the API', async () => {
    await expect(run({ action: createEntity, propsValue: { entityType: 'Product', entityData: 42 } })).rejects.toThrow(
      'Entity Data must be a JSON object',
    );
    expect(handler.create).not.toHaveBeenCalled();
  });

  it('find rejects invalid JSON text', async () => {
    await expect(run({ action: findEntity, propsValue: { entityType: 'Product', searchQuery: '{name' } })).rejects.toThrow(
      'Search Query is not valid JSON',
    );
    expect(handler.filter).not.toHaveBeenCalled();
  });

  it('find accepts a query passed as JSON text', async () => {
    handler.filter.mockResolvedValue([]);
    await run({ action: findEntity, propsValue: { entityType: 'Product', searchQuery: '{"name":"A"}' } });
    expect(handler.filter).toHaveBeenCalledWith({ name: 'A' }, undefined, 50);
  });

  it('update rejects an array before calling the API', async () => {
    await expect(
      run({ action: updateEntityRecord, propsValue: { entityType: 'Product', recordId: 'r1', updateData: ['x'] } }),
    ).rejects.toThrow('Update Data must be a JSON object');
    expect(handler.update).not.toHaveBeenCalled();
  });

  it('find or create is human only', () => {
    expect(findOrCreateEntity.audience).toBe('human');
  });

  it('get returns the record', async () => {
    handler.get.mockResolvedValue({ id: 'r1' });
    const result = await run({ action: getEntityRecord, propsValue: { entityType: 'Product', recordId: ' r1 ' } });
    expect(handler.get).toHaveBeenCalledWith('r1');
    expect(result).toEqual({ id: 'r1' });
  });

  it('get maps a 404 to a not found error with vendor text', async () => {
    handler.get.mockRejectedValue(vendorError({ status: 404, message: 'Entity not found' }));
    await expect(run({ action: getEntityRecord, propsValue: { entityType: 'Product', recordId: 'x' } })).rejects.toThrow(/HTTP 404.*Entity not found.*entity type "Product"/);
  });

  it('points a missing app at the App ID, not the entity type', async () => {
    handler.get.mockRejectedValue(vendorError({ status: 404, message: 'App not found' }));
    const error = await run({ action: getEntityRecord, propsValue: { entityType: 'Product', recordId: 'x' } }).catch((e: unknown) => e);
    const message = String(Reflect.get(Object(error), 'message'));
    expect(message).toMatch(/App ID/);
    expect(message).not.toMatch(/Product/);
  });

  it('gives no hint for an unrecognised 404', async () => {
    handler.get.mockRejectedValue(vendorError({ status: 404, message: 'Gone' }));
    const error = await run({ action: getEntityRecord, propsValue: { entityType: 'Product', recordId: 'x' } }).catch((e: unknown) => e);
    expect(String(Reflect.get(Object(error), 'message'))).toBe('Not found (HTTP 404) while trying to get the record: Gone.');
  });

  it('does not double the period when the vendor text ends with one', async () => {
    handler.list.mockRejectedValue(vendorError({ status: 403, message: 'This app is not yet available. Please check back later.' }));
    const error = await run({ action: listEntityRecords, propsValue: { entityType: 'Product' } }).catch((e: unknown) => e);
    const message = String(Reflect.get(Object(error), 'message'));
    expect(message).not.toContain('..');
    expect(message).toContain('Please check back later. Check the App ID');
  });

  it('rejects a missing entity type with a clear message', async () => {
    await expect(run({ action: listEntityRecords, propsValue: {} })).rejects.toThrow('Entity type is required.');
    await expect(run({ action: createEntity, propsValue: { entityType: '  ', entityData: {} } })).rejects.toThrow('Entity type is required.');
    expect(createClient).not.toHaveBeenCalled();
  });

  it('rejects a missing record ID with a clear message', async () => {
    await expect(run({ action: getEntityRecord, propsValue: { entityType: 'Product' } })).rejects.toThrow('Record ID is required.');
    await expect(run({ action: deleteEntityRecord, propsValue: { entityType: 'Product' } })).rejects.toThrow('Record ID is required.');
    expect(handler.get).not.toHaveBeenCalled();
    expect(handler.delete).not.toHaveBeenCalled();
  });

  it('points a missing entity schema at the entity type name, not the App ID', async () => {
    handler.list.mockRejectedValue(vendorError({ status: 404, message: 'Entity schema Productz not found in app' }));
    const error = await run({ action: listEntityRecords, propsValue: { entityType: 'Productz' } }).catch((e: unknown) => e);
    const message = String(Reflect.get(Object(error), 'message'));
    expect(message).toContain('Check the entity type name "Productz" (it is case-sensitive).');
    expect(message).not.toMatch(/App ID/);
  });

  it('points a missing record at the entity type and record ID', async () => {
    handler.get.mockRejectedValue(vendorError({ status: 404, message: 'User not found.' }));
    const error = await run({ action: getEntityRecord, propsValue: { entityType: 'User', recordId: 'x' } }).catch((e: unknown) => e);
    const message = String(Reflect.get(Object(error), 'message'));
    expect(message).toBe('Not found (HTTP 404) while trying to get the record: User not found. Check the entity type "User" and the record ID.');
  });

  it('validate lists one User record and accepts a working connection', async () => {
    setupClient();
    handler.list.mockResolvedValue([{ id: 'u1' }]);
    const result = await validate({ appId: 'app1', token: 'tok' });
    expect(handler.list).toHaveBeenCalledWith(undefined, 1);
    expect(result).toEqual({ valid: true });
  });

  it('validate skips the User check when no token is set', async () => {
    setupClient();
    handler.list.mockRejectedValue(vendorError({ status: 401, message: 'Authentication required to list users' }));
    expect(await validate({ appId: 'app1' })).toEqual({ valid: true });
    expect(await validate({ appId: 'app1', token: '  ' })).toEqual({ valid: true });
    expect(handler.list).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('validate reports a missing app with the App ID hint', async () => {
    setupClient();
    handler.list.mockRejectedValue(vendorError({ status: 404, message: 'App not found' }));
    const result = await validate({ appId: 'bad', token: 'tok' });
    expect(Reflect.get(Object(result), 'valid')).toBe(false);
    expect(String(Reflect.get(Object(result), 'error'))).toMatch(/App ID/);
  });

  it('validate reports rejected credentials', async () => {
    setupClient();
    handler.list.mockRejectedValue(vendorError({ status: 401, message: 'Invalid token' }));
    const result = await validate({ appId: 'app1', token: 'bad' });
    expect(String(Reflect.get(Object(result), 'error'))).toMatch(/rejected the credentials \(HTTP 401\): Invalid token/);
  });

  it('maps a 401 to a credentials error and keeps the vendor body', async () => {
    handler.list.mockRejectedValue(vendorError({ status: 401, message: 'Invalid token' }));
    const error = await run({ action: listEntityRecords, propsValue: { entityType: 'Product' } }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(Reflect.get(Object(error), 'message')).toMatch(/HTTP 401.*Invalid token/);
    expect(Reflect.get(Object(error), 'responseBody')).toEqual({ message: 'Invalid token' });
    expect(Reflect.get(Object(error), 'status')).toBeUndefined();
  });

  it('update rejects empty data before calling the API', async () => {
    await expect(run({ action: updateEntityRecord, propsValue: { entityType: 'Product', recordId: 'r1', updateData: {} } })).rejects.toThrow(/at least one field/);
    expect(handler.update).not.toHaveBeenCalled();
  });

  it('update sends a partial patch', async () => {
    handler.update.mockResolvedValue({ id: 'r1', status: 'shipped' });
    const result = await run({ action: updateEntityRecord, propsValue: { entityType: 'Product', recordId: 'r1', updateData: { status: 'shipped' } } });
    expect(handler.update).toHaveBeenCalledWith('r1', { status: 'shipped' });
    expect(result).toEqual({ id: 'r1', status: 'shipped' });
  });

  it('delete returns success and id', async () => {
    handler.delete.mockResolvedValue({ success: true });
    const result = await run({ action: deleteEntityRecord, propsValue: { entityType: 'Product', recordId: 'r1' } });
    expect(result).toEqual({ success: true, id: 'r1' });
  });

  it('list forwards sort, limit and skip', async () => {
    handler.list.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
    const result = await run({ action: listEntityRecords, propsValue: { entityType: 'Product', sort: 'name', limit: 10, skip: 20 } });
    expect(handler.list).toHaveBeenCalledWith('name', 10, 20);
    expect(result).toEqual({ count: 2, records: [{ id: 'a' }, { id: 'b' }] });
  });

  it('every action declares an outputSchema', () => {
    for (const action of [createEntity, findEntity, findOrCreateEntity, getEntityRecord, updateEntityRecord, deleteEntityRecord, listEntityRecords]) {
      expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
    }
  });
});

import { afterEach, describe, expect, test, vi } from 'vitest';
import { BikaApiError, bikaClient } from '../src/lib/common/client';
import { ok, RECORDS_PATH, stubFetch, TOKEN } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('bika client', () => {
  test('sends a trimmed bearer token to the fixed Bika host', async () => {
    const seen = stubFetch(() => ok({ id: 'rec1', fields: {} }));
    await bikaClient.getRecord({ token: ` ${TOKEN} `, spaceId: 'spc1', databaseId: 'dat1', recordId: 'rec1' });
    expect(seen[0].url).toBe(`https://bika.ai${RECORDS_PATH}/rec1`);
    expect(seen[0].headers.get('authorization')).toBe(`Bearer ${TOKEN}`);
  });

  test('rejects IDs that would change the path before any request', async () => {
    const seen = stubFetch(() => ok({}));
    await expect(bikaClient.getRecord({ token: TOKEN, spaceId: 'spc1', databaseId: '../x', recordId: 'rec1' })).rejects.toThrow('not a valid Bika ID');
    await expect(bikaClient.getRecord({ token: TOKEN, spaceId: 'spc1', databaseId: 'dat1', recordId: '' })).rejects.toThrow('Record ID is required');
    expect(seen).toHaveLength(0);
  });

  test('maps HTTP errors to readable messages and keeps the body as responseBody', async () => {
    stubFetch(() => ({ status: 401, body: { success: false, code: 401, message: 'Unauthorized', data: {} } }));
    const error = await bikaClient.listSpaces({ token: TOKEN }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(BikaApiError);
    expect(error).toMatchObject({ status: 401, message: expect.stringContaining('token is invalid') });
    expect(Object.keys(error instanceof Error ? error : {})).not.toContain('body');

    stubFetch(() => ({ status: 404, body: { success: false, code: 404, message: 'Record not found' } }));
    await expect(bikaClient.getRecord({ token: TOKEN, spaceId: 'spc1', databaseId: 'dat1', recordId: 'rec9' })).rejects.toThrow(/not found.*Record not found/);
  });

  test('explains a not-found record that Bika reports as HTTP 500', async () => {
    stubFetch(() => ({ status: 500, body: { success: false, code: 500, message: 'Record not found: rec9', data: {} } }));
    await expect(bikaClient.getRecord({ token: TOKEN, spaceId: 'spc1', databaseId: 'dat1', recordId: 'rec9' })).rejects.toThrow(
      'Bika could not get the record (HTTP 500): not found. Check the space, database and record IDs. Record not found: rec9',
    );
  });

  test('treats a 200 with success false as a failure', async () => {
    stubFetch(() => ({ body: { success: false, code: 500, message: 'Field "Nope" does not exist' } }));
    await expect(bikaClient.createRecord({ token: TOKEN, spaceId: 'spc1', databaseId: 'dat1', fields: { Nope: 1 } })).rejects.toThrow('Field "Nope" does not exist');
  });

  test('retries a 429 rate limit once', async () => {
    const seen = stubFetch((_request, index) => (index === 0 ? { status: 429, body: { success: false, code: 429, message: 'Too many requests' } } : ok([])));
    await bikaClient.listSpaces({ token: TOKEN });
    expect(seen).toHaveLength(2);
  });

  test('does not retry when the monthly quota is used up and says so', async () => {
    const seen = stubFetch(() => ({ status: 429, body: { success: false, code: 429, message: 'API_REQUEST quota exceeded' } }));
    await expect(bikaClient.listSpaces({ token: TOKEN })).rejects.toThrow('monthly API request quota');
    expect(seen).toHaveLength(1);
  });

  test('lists only DATABASE nodes from the flat node list', async () => {
    stubFetch(() =>
      ok([
        { id: 'rot1', name: 'ROOT', type: 'ROOT', parentId: null },
        { id: 'fld1', name: 'CRM', type: 'FOLDER', path: '/ROOT' },
        { id: 'dat1', name: 'CRM Database', type: 'DATABASE', parentId: 'fld1', path: '/ROOT/CRM' },
        { id: 'fom1', name: 'Form', type: 'FORM', path: '/ROOT/CRM' },
      ]),
    );
    const databases = await bikaClient.listDatabases({ token: TOKEN, spaceId: 'spc1' });
    expect(databases).toEqual([{ id: 'dat1', name: 'CRM Database', type: 'DATABASE', parentId: 'fld1', path: '/ROOT/CRM' }]);
  });

  test('reads the attachment id from an object or nested response, and shows the body when missing', async () => {
    stubFetch(() => ok({ attachment: { id: 'att2', name: 'b.txt' } }));
    expect(await bikaClient.uploadAttachment({ token: TOKEN, spaceId: 'spc1', file: { filename: 'b.txt', data: Buffer.from('b') } })).toMatchObject({ id: 'att2' });
    stubFetch(() => ok({ id: 'att3' }));
    expect(await bikaClient.uploadAttachment({ token: TOKEN, spaceId: 'spc1', file: { filename: 'c.txt', data: Buffer.from('c') } })).toMatchObject({ id: 'att3', name: 'c.txt' });
    stubFetch(() => ok({ path: 'x' }));
    await expect(bikaClient.uploadAttachment({ token: TOKEN, spaceId: 'spc1', file: { filename: 'd.txt', data: Buffer.from('d') } })).rejects.toThrow('returned no attachment ID: {"path":"x"}');
  });

  test('uploads a file as multipart and returns the attachment id', async () => {
    const seen = stubFetch(() => ok([{ id: 'att1', name: 'a.txt', path: 'p', bucket: 'b', mimeType: 'text/plain', size: 3 }]));
    const uploaded = await bikaClient.uploadAttachment({ token: TOKEN, spaceId: 'spc1', file: { filename: 'a.txt', data: Buffer.from('abc') } });
    expect(seen[0].path).toBe('/api/openapi/bika/v1/spaces/spc1/attachments');
    expect(seen[0].method).toBe('POST');
    const contentType = seen[0].headers.get('content-type') ?? '';
    expect(contentType).toMatch(/^multipart\/form-data; boundary=----ActivepiecesBika[0-9a-f]+$/);
    const boundary = contentType.split('boundary=')[1];
    expect(seen[0].bytes).toBe(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="a.txt"\r\nContent-Type: text/plain\r\n\r\nabc\r\n--${boundary}--\r\n`,
    );
    expect(uploaded).toMatchObject({ id: 'att1', name: 'a.txt' });
  });
});

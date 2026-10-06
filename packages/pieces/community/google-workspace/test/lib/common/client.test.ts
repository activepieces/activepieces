import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendRequest } = vi.hoisted(() => ({
  sendRequest: vi.fn<() => Promise<{ body: unknown }>>(),
}));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

const { HttpError, HttpMethod } = await import('@activepieces/pieces-common');
const { GOOGLE_ADMIN_API_ROOT, GoogleWorkspaceApi, GoogleWorkspaceApiError } = await import('../../../src/lib/common/client');

const TOKEN = 'ya29.test-token';
const AUTH = { access_token: TOKEN };

function httpError(status: number, data: unknown): InstanceType<typeof HttpError> {
  return new HttpError({}, { status, responseBody: data });
}

describe('GoogleWorkspaceApi', () => {
  beforeEach(() => {
    sendRequest.mockReset();
  });

  describe('request()', () => {
    it('should call the Admin SDK root with the bearer token and drop empty query params', async () => {
      sendRequest.mockResolvedValue({ body: { primaryEmail: 'jane@example.com' } });

      const body = await GoogleWorkspaceApi.request({
        auth: AUTH,
        method: HttpMethod.GET,
        path: '/admin/directory/v1/users/jane%40example.com',
        query: { projection: 'full', customFieldMask: undefined, viewType: '' },
      });

      expect(body).toEqual({ primaryEmail: 'jane@example.com' });
      expect(sendRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: `${GOOGLE_ADMIN_API_ROOT}/admin/directory/v1/users/jane%40example.com`,
        queryParams: { projection: 'full' },
        authentication: { type: 'BEARER_TOKEN', token: TOKEN },
      });
    });

    it('should send the body on writes and omit queryParams when there are none', async () => {
      sendRequest.mockResolvedValue({ body: { id: '1' } });

      await GoogleWorkspaceApi.request({
        auth: AUTH,
        method: HttpMethod.POST,
        path: 'admin/directory/v1/groups',
        body: { email: 'sales@example.com' },
      });

      expect(sendRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: `${GOOGLE_ADMIN_API_ROOT}/admin/directory/v1/groups`,
        body: { email: 'sales@example.com' },
        authentication: { type: 'BEARER_TOKEN', token: TOKEN },
      });
    });

    it('should turn a Google error body into a GoogleWorkspaceApiError with reason, message and hint', async () => {
      sendRequest.mockRejectedValue(
        httpError(404, {
          error: {
            code: 404,
            message: 'Resource Not Found: userKey',
            errors: [{ domain: 'global', reason: 'notFound', message: 'Resource Not Found: userKey' }],
          },
        })
      );

      const failure = await GoogleWorkspaceApi.request({ auth: AUTH, method: HttpMethod.GET, path: 'admin/directory/v1/users/x' }).catch(
        (e: unknown) => e
      );

      expect(failure).toBeInstanceOf(GoogleWorkspaceApiError);
      const error = failure as InstanceType<typeof GoogleWorkspaceApiError>;
      expect(error.status).toBe(404);
      expect(error.hasReason('notFound')).toBe(true);
      expect(error.errors).toEqual([{ reason: 'notFound', message: 'Resource Not Found: userKey', domain: 'global' }]);
      expect(error.message).toBe(
        'Google Workspace API returned 404: notFound: Resource Not Found: userKey Check the identifier: user and group keys are e-mails or ids, org units are paths, devices use their resource id.'
      );
    });

    it('should tell the user to enable the Admin SDK API on accessNotConfigured', async () => {
      sendRequest.mockRejectedValue(
        httpError(403, {
          error: {
            code: 403,
            status: 'PERMISSION_DENIED',
            message: 'Admin SDK API has not been used in project 123 before or it is disabled.',
            errors: [{ reason: 'accessNotConfigured', message: 'Access Not Configured.' }],
          },
        })
      );

      await expect(GoogleWorkspaceApi.request({ auth: AUTH, method: HttpMethod.GET, path: 'admin/directory/v1/users' })).rejects.toThrow(
        'Google Workspace API returned 403 (PERMISSION_DENIED): accessNotConfigured: Access Not Configured. Enable the Admin SDK API'
      );
    });

    it('should fall back to the raw body when Google sends no structured error', async () => {
      sendRequest.mockRejectedValue(httpError(502, 'Bad Gateway'));

      await expect(GoogleWorkspaceApi.request({ auth: AUTH, method: HttpMethod.GET, path: 'admin/directory/v1/users' })).rejects.toThrow(
        'Google Workspace API returned 502: Bad Gateway'
      );
    });

    it('should summarize an HTML error page instead of dumping it', async () => {
      sendRequest.mockRejectedValue(
        httpError(404, '<!DOCTYPE html>\n<html lang=en><title>Error 404 (Not Found)!!1</title><p>The requested URL <code>/admin/directory/v1/users/</code> was not found on this server.</p></html>')
      );

      await expect(GoogleWorkspaceApi.request({ auth: AUTH, method: HttpMethod.GET, path: 'admin/directory/v1/users/' })).rejects.toThrow(
        'Google Workspace API returned 404: Error 404 (Not Found)!!1 for /admin/directory/v1/users/ (the request URL is malformed, usually an empty identifier). Check the identifier'
      );
    });

    it('should rethrow errors that are not HTTP failures untouched', async () => {
      sendRequest.mockRejectedValue(new Error('socket hang up'));

      await expect(GoogleWorkspaceApi.request({ auth: AUTH, method: HttpMethod.GET, path: 'admin/directory/v1/users' })).rejects.toThrow(
        'socket hang up'
      );
    });
  });

  describe('listPage()', () => {
    it('should read the collection array by its key and the next page token', async () => {
      sendRequest.mockResolvedValue({ body: { kind: 'admin#directory#users', users: [{ id: '1' }], nextPageToken: 'p2' } });

      const page = await GoogleWorkspaceApi.listPage({ auth: AUTH, path: 'admin/directory/v1/users', itemsKey: 'users', query: { customer: 'my_customer' } });

      expect(page).toEqual({ items: [{ id: '1' }], nextPageToken: 'p2' });
      expect(sendRequest).toHaveBeenCalledWith(expect.objectContaining({ queryParams: { customer: 'my_customer' } }));
    });

    it('should return an empty list when the collection key is absent', async () => {
      sendRequest.mockResolvedValue({ body: { kind: 'admin#directory#groups' } });

      await expect(GoogleWorkspaceApi.listPage({ auth: AUTH, path: 'admin/directory/v1/groups', itemsKey: 'groups' })).resolves.toEqual({ items: [] });
    });
  });

  describe('listAll()', () => {
    it('should follow nextPageToken until exhausted', async () => {
      sendRequest
        .mockResolvedValueOnce({ body: { users: [{ id: '1' }, { id: '2' }], nextPageToken: 'p2' } })
        .mockResolvedValueOnce({ body: { users: [{ id: '3' }] } });

      const { items, truncated } = await GoogleWorkspaceApi.listAll({ auth: AUTH, path: 'admin/directory/v1/users', itemsKey: 'users', query: { customer: 'my_customer' } });

      expect(items).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }]);
      expect(truncated).toBe(false);
      expect(sendRequest).toHaveBeenLastCalledWith(expect.objectContaining({ queryParams: { customer: 'my_customer', pageToken: 'p2' } }));
    });

    it('should stop at maxRows and flag the result as truncated', async () => {
      sendRequest.mockResolvedValue({ body: { users: [{ id: '1' }, { id: '2' }, { id: '3' }], nextPageToken: 'more' } });

      const { items, truncated } = await GoogleWorkspaceApi.listAll({ auth: AUTH, path: 'admin/directory/v1/users', itemsKey: 'users', query: {}, maxRows: 2 });

      expect(items).toEqual([{ id: '1' }, { id: '2' }]);
      expect(truncated).toBe(true);
      expect(sendRequest).toHaveBeenCalledTimes(1);
    });
  });
});

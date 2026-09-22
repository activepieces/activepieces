import { AppConnectionType } from '@activepieces/pieces-framework';
import { httpClient, HttpResponse } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newPost } from './new-post';

const WEBHOOK_URL = 'https://cloud.activepieces.com/api/v1/webhooks/flow-1';

const legacyConnection = {
  type: AppConnectionType.CUSTOM_AUTH,
  props: {
    base_url: 'https://api.postiz.com/public/v1',
    api_key: 'pk_live_123',
  },
};

const jwtConnection = {
  type: AppConnectionType.CUSTOM_AUTH,
  props: {
    authType: 'jwt',
    base_url: 'https://api.postiz.com/public/v1',
    api_key: 'pk_live_123',
    email: 'me@example.com',
    password: 'secret',
  },
};

function makeStore(
  initial: Record<string, unknown> = {},
  options: { failPut?: boolean } = {}
) {
  const data: Record<string, unknown> = { ...initial };
  return {
    data,
    get: async (key: string) => (key in data ? data[key] : undefined),
    put: async (key: string, value: unknown) => {
      if (options.failPut) {
        throw new Error('store unavailable');
      }
      data[key] = value;
      return value;
    },
    delete: async (key: string) => {
      delete data[key];
    },
  };
}

function hookContext({
  auth,
  store,
  payload,
}: {
  auth: unknown;
  store?: ReturnType<typeof makeStore>;
  payload?: unknown;
}) {
  return {
    auth,
    store: store ?? makeStore(),
    propsValue: {},
    webhookUrl: WEBHOOK_URL,
    payload: { body: payload },
    flows: { current: { id: 'flow-1' } },
  } as never;
}

function response(body: unknown, headers: Record<string, string> = {}): HttpResponse {
  return { status: 200, headers, body };
}

let sendRequest: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  sendRequest = vi.spyOn(httpClient, 'sendRequest');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('onEnable', () => {
  it('leaves Postiz alone for a connection saved before the authType dropdown', async () => {
    const store = makeStore();
    await newPost.onEnable(hookContext({ auth: legacyConnection, store }));

    expect(sendRequest).not.toHaveBeenCalled();
    expect(store.data).toEqual({});
  });

  it('registers the webhook against the internal API and stores its id', async () => {
    sendRequest
      .mockResolvedValueOnce(
        response({ login: true }, { 'set-cookie': 'auth=jwt-token; Path=/; HttpOnly' })
      )
      .mockResolvedValueOnce(response({ id: 'webhook-9' }));
    const store = makeStore();

    await newPost.onEnable(hookContext({ auth: jwtConnection, store }));

    expect(sendRequest).toHaveBeenNthCalledWith(1, {
      method: 'POST',
      url: 'https://api.postiz.com/auth/login',
      body: { provider: 'LOCAL', email: 'me@example.com', password: 'secret' },
    });
    expect(sendRequest).toHaveBeenNthCalledWith(2, {
      method: 'POST',
      url: 'https://api.postiz.com/webhooks',
      headers: { auth: 'jwt-token' },
      body: {
        name: 'Activepieces (flow-1)',
        url: WEBHOOK_URL,
        integrations: [],
      },
    });
    expect(store.data).toEqual({ postiz_webhook_id: 'webhook-9' });
  });

  it('reuses the stored webhook on republish instead of registering a second one', async () => {
    sendRequest
      .mockResolvedValueOnce(response({ login: true }, { auth: 'header-token' }))
      .mockResolvedValueOnce(response({ id: 'webhook-9' }));
    const store = makeStore({ postiz_webhook_id: 'webhook-9' });

    await newPost.onEnable(hookContext({ auth: jwtConnection, store }));

    expect(sendRequest).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        body: expect.objectContaining({ id: 'webhook-9', url: WEBHOOK_URL }),
      })
    );
    expect(store.data).toEqual({ postiz_webhook_id: 'webhook-9' });
  });

  it('sends no id on a first enable, so Postiz creates the webhook', async () => {
    sendRequest
      .mockResolvedValueOnce(response({ login: true }, { auth: 'header-token' }))
      .mockResolvedValueOnce(response({ id: 'webhook-9' }));

    await newPost.onEnable(hookContext({ auth: jwtConnection }));

    const body = sendRequest.mock.calls[1][0].body;
    expect(body).not.toHaveProperty('id');
  });

  it('deletes the webhook it just created when the id cannot be stored', async () => {
    sendRequest
      .mockResolvedValueOnce(response({ login: true }, { auth: 'header-token' }))
      .mockResolvedValueOnce(response({ id: 'webhook-9' }))
      .mockResolvedValueOnce(response({ login: true }, { auth: 'header-token' }))
      .mockResolvedValueOnce(response({}));
    const store = makeStore({}, { failPut: true });

    await expect(
      newPost.onEnable(hookContext({ auth: jwtConnection, store }))
    ).rejects.toThrow('store unavailable');

    expect(sendRequest).toHaveBeenNthCalledWith(4, {
      method: 'DELETE',
      url: 'https://api.postiz.com/webhooks/webhook-9',
      headers: { auth: 'header-token' },
    });
  });

  it('reads the session token from the auth header when Postiz sends one', async () => {
    sendRequest
      .mockResolvedValueOnce(response({ login: true }, { auth: 'header-token' }))
      .mockResolvedValueOnce(response({ id: 'webhook-9' }));

    await newPost.onEnable(hookContext({ auth: jwtConnection }));

    expect(sendRequest).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ headers: { auth: 'header-token' } })
    );
  });

  it('explains what to do when Postiz refuses the webhook URL', async () => {
    sendRequest
      .mockResolvedValueOnce(response({ login: true }, { auth: 'header-token' }))
      .mockRejectedValueOnce(new Error('Request failed with status code 400'));

    await expect(
      newPost.onEnable(hookContext({ auth: jwtConnection }))
    ).rejects.toThrow('public HTTPS URLs');
  });
});

describe('onDisable', () => {
  it('deletes the registered webhook and clears the stored id', async () => {
    sendRequest
      .mockResolvedValueOnce(response({ login: true }, { auth: 'header-token' }))
      .mockResolvedValueOnce(response({ id: 'webhook-9' }));
    const store = makeStore({ postiz_webhook_id: 'webhook-9' });

    await newPost.onDisable(hookContext({ auth: jwtConnection, store }));

    expect(sendRequest).toHaveBeenNthCalledWith(2, {
      method: 'DELETE',
      url: 'https://api.postiz.com/webhooks/webhook-9',
      headers: { auth: 'header-token' },
    });
    expect(store.data).toEqual({});
  });

  it('does not call Postiz for a connection saved before the authType dropdown', async () => {
    const store = makeStore({ postiz_webhook_id: 'webhook-9' });

    await newPost.onDisable(hookContext({ auth: legacyConnection, store }));

    expect(sendRequest).not.toHaveBeenCalled();
    expect(store.data).toEqual({});
  });

  it('keeps the stored id when the deletion fails, so the next enable reuses it', async () => {
    sendRequest.mockRejectedValue(new Error('Request failed with status code 500'));
    const store = makeStore({ postiz_webhook_id: 'webhook-9' });

    await newPost.onDisable(hookContext({ auth: jwtConnection, store }));

    expect(store.data).toEqual({ postiz_webhook_id: 'webhook-9' });
  });
});

describe('run', () => {
  const publishedPost = {
    id: 'post-1',
    content: 'Hello world',
    publishDate: '2024-12-15T10:00:00.000Z',
    releaseURL: 'https://x.com/user/status/1',
    state: 'PUBLISHED',
    integration: {
      id: 'int-1',
      providerIdentifier: 'x',
      name: 'My X Account',
      picture: 'https://example.com/a.png',
    },
  };

  const expectedOutput = {
    id: 'post-1',
    content: 'Hello world',
    publish_date: '2024-12-15T10:00:00.000Z',
    release_url: 'https://x.com/user/status/1',
    state: 'PUBLISHED',
    integration_id: 'int-1',
    integration_provider: 'x',
    integration_name: 'My X Account',
  };

  it('keeps the output shape the polling trigger used to emit', async () => {
    const items = await newPost.run(
      hookContext({ auth: legacyConnection, payload: [publishedPost] })
    );

    expect(items).toEqual([expectedOutput]);
  });

  it('accepts a single post as well as an array', async () => {
    const items = await newPost.run(
      hookContext({ auth: legacyConnection, payload: publishedPost })
    );

    expect(items).toEqual([expectedOutput]);
  });

  it('ignores a payload that carries no post', async () => {
    expect(
      await newPost.run(hookContext({ auth: legacyConnection, payload: [] }))
    ).toEqual([]);
    expect(
      await newPost.run(hookContext({ auth: legacyConnection, payload: undefined }))
    ).toEqual([]);
  });
});

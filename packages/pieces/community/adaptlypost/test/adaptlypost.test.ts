import crypto from 'crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  HttpError,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  AppConnectionType,
  DEDUPE_KEY_PROPERTY,
  InputPropertyMap,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { createMockActionContext } from '../../../framework/src/lib/test';
import { adaptlypost } from '../src';
import { createPostAction } from '../src/lib/actions/create-post';
import { deletePostAction } from '../src/lib/actions/delete-post';
import { findPostsAction } from '../src/lib/actions/find-posts';
import { publishDraftAction } from '../src/lib/actions/publish-draft';
import { uploadFileAction } from '../src/lib/actions/upload-file';
import { adaptlyPostClient } from '../src/lib/common/client';
import { adaptlyPostOutput } from '../src/lib/common/output';
import { AdaptlyPostPost } from '../src/lib/common/types';
import { adaptlyPostWebhook } from '../src/lib/common/webhook';
import { postFailedTrigger } from '../src/lib/triggers/post-failed';
import { postPublishedTrigger } from '../src/lib/triggers/post-published';

const BASE = 'https://post.adaptlypost.com/post/api/v1';
const auth = {
  type: AppConnectionType.SECRET_TEXT,
  secret_text: 'adaptly_test',
};

const POST: AdaptlyPostPost = {
  id: 'post_1',
  status: 'PARTIAL_FAILURE',
  contentType: 'IMAGE',
  text: 'Launch day.',
  scheduledAt: '2026-11-01T09:00:00.000Z',
  timezone: 'UTC',
  createdAt: '2026-10-30T14:12:00.000Z',
  updatedAt: '2026-11-01T09:05:12.000Z',
  mediaUrls: ['https://cdn.example.com/a.jpg'],
  platforms: [
    {
      platform: 'LINKEDIN',
      status: 'PUBLISHED',
      postUrl: 'https://linkedin.com/p/1',
    },
    { platform: 'TWITTER', status: 'FAILED', errorMessage: 'Text too long' },
  ],
  labels: [{ id: 'label_1', name: 'Brand A', color: '#000' }],
};

afterEach(() => {
  vi.restoreAllMocks();
});

function actionContext<Props extends InputPropertyMap>(
  propsValue: StaticPropsValue<Props>
) {
  return { ...createMockActionContext<Props>({ propsValue }), auth };
}

function mockResponses(bodies: unknown[]) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const body of bodies) {
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body });
  }
  return spy;
}

function sentRequest(
  spy: ReturnType<typeof mockResponses>,
  index = 0
): HttpRequest {
  return spy.mock.calls[index][0] as HttpRequest;
}

function memoryStore() {
  const values = new Map<string, unknown>();
  return {
    values,
    put: async <T>(key: string, value: T) => {
      values.set(key, value);
      return value;
    },
    get: async <T>(key: string) =>
      values.has(key) ? (values.get(key) as T) : null,
    delete: async (key: string) => {
      values.delete(key);
    },
  };
}

function signedDelivery({ secret, body }: { secret: string; body: object }) {
  const rawBody = JSON.stringify(body);
  const timestamp = '1764320000';
  const signature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')}`;
  return {
    body,
    rawBody,
    headers: {
      'x-adaptly-timestamp': timestamp,
      'x-adaptly-signature': signature,
    },
  };
}

describe('piece definition', () => {
  it('tags every action and trigger for agents', () => {
    for (const action of Object.values(adaptlypost.actions())) {
      if (action.name === 'custom_api_call') continue;
      expect(action.classification, action.name).toBeDefined();
      expect(action.audience, action.name).toBe('both');
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
      expect(typeof action.aiMetadata?.idempotent, action.name).toBe('boolean');
    }
    for (const trigger of Object.values(adaptlypost.triggers())) {
      expect(trigger.classification, trigger.name).toBe('READ');
      expect(trigger.aiMetadata?.description, trigger.name).toBeTruthy();
    }
  });
});

describe('client', () => {
  it('repeats array query values and drops empty ones', () => {
    expect(
      adaptlyPostClient.toQueryString({
        statuses: ['DRAFT', 'FAILED'],
        limit: 5,
        startDate: undefined,
        query: '',
      })
    ).toBe('?statuses=DRAFT&statuses=FAILED&limit=5');
  });

  it('turns an HTTP error into a message with the API reason', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValueOnce(
      new HttpError(
        {},
        {
          status: 403,
          responseBody: { message: 'Missing permission posts.publish' },
        }
      )
    );
    await expect(
      adaptlyPostClient.request({
        apiKey: 'k',
        method: HttpMethod.GET,
        path: '/me',
      })
    ).rejects.toMatchObject({
      status: 403,
      message:
        "The API key's role can't do this (403). Missing permission posts.publish",
    });
  });
});

describe('output', () => {
  it('flattens a post into one row per post', () => {
    expect(adaptlyPostOutput.post(POST)).toEqual({
      post_id: 'post_1',
      status: 'PARTIAL_FAILURE',
      content_type: 'IMAGE',
      text: 'Launch day.',
      scheduled_at: '2026-11-01T09:00:00.000Z',
      timezone: 'UTC',
      created_at: '2026-10-30T14:12:00.000Z',
      updated_at: '2026-11-01T09:05:12.000Z',
      platforms: 'LINKEDIN, TWITTER',
      published_platforms: 'LINKEDIN',
      failed_platforms: 'TWITTER',
      post_urls: 'https://linkedin.com/p/1',
      errors: 'TWITTER: Text too long',
      media_urls: 'https://cdn.example.com/a.jpg',
      labels: 'Brand A',
      label_ids: 'label_1',
      recurring_post_id: null,
    });
  });
});

describe('actions', () => {
  it('Create Post sends only the fields that are set', async () => {
    const spy = mockResponses([
      {
        postId: 'post_1',
        queuedPlatforms: ['LINKEDIN'],
        skippedPlatforms: [],
        isScheduled: false,
      },
    ]);
    const result = await createPostAction.run(
      actionContext({
        accounts: ['acc_1', 'acc_2'],
        content_type: 'TEXT',
        text: 'Hello',
        media_urls: [],
        media_alt_texts: undefined,
        scheduled_at: undefined,
        timezone: 'Europe/Kyiv',
        save_as_draft: false,
        labels: undefined,
      })
    );
    const request = sentRequest(spy);
    expect(request.method).toBe(HttpMethod.POST);
    expect(request.url).toBe(`${BASE}/social-posts`);
    expect(JSON.parse(JSON.stringify(request.body))).toEqual({
      accountIds: ['acc_1', 'acc_2'],
      contentType: 'TEXT',
      text: 'Hello',
      timezone: 'Europe/Kyiv',
    });
    expect(result).toEqual({
      post_id: 'post_1',
      is_scheduled: false,
      scheduled_at: null,
      queued_platforms: 'LINKEDIN',
      skipped_platforms: null,
      recurring_post_id: null,
    });
  });

  it('Find Posts pages with offset until it has Limit posts', async () => {
    const page = (start: number, count: number) =>
      Array.from({ length: count }, (_, i) => ({
        ...POST,
        id: `post_${start + i}`,
      }));
    const spy = mockResponses([
      { posts: page(0, 100), hasMore: true },
      { posts: page(100, 50), hasMore: true },
    ]);
    const result = await findPostsAction.run(
      actionContext({
        statuses: ['FAILED'],
        platforms: undefined,
        labels: undefined,
        start_date: undefined,
        end_date: undefined,
        sort_order: 'NEWEST',
        limit: 150,
      })
    );
    expect(result).toHaveLength(150);
    expect(sentRequest(spy, 0).url).toBe(
      `${BASE}/social-posts?limit=100&offset=0&sortOrder=NEWEST&statuses=FAILED`
    );
    expect(sentRequest(spy, 1).url).toBe(
      `${BASE}/social-posts?limit=50&offset=100&sortOrder=NEWEST&statuses=FAILED`
    );
  });

  it('Publish Draft refuses Schedule For together with Publish Now', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(
      publishDraftAction.run(
        actionContext({
          post_id: 'post_1',
          scheduled_at: '2026-12-01T09:00:00Z',
          publish_now: true,
          timezone: 'UTC',
        })
      )
    ).rejects.toThrow('not both');
    expect(spy).not.toHaveBeenCalled();
  });

  it('Delete Post returns the deleted post id', async () => {
    const spy = mockResponses([{ deleted: true }]);
    await expect(
      deletePostAction.run(actionContext({ post_id: 'post 1' }))
    ).resolves.toEqual({ post_id: 'post 1', deleted: true });
    expect(sentRequest(spy).url).toBe(`${BASE}/social-posts/post%201`);
  });

  it('Upload File gets a signed URL and PUTs the bytes with the right type', async () => {
    const spy = mockResponses([
      {
        urls: [
          {
            fileName: 'launch.png',
            uploadUrl: 'https://storage.example.com/put',
            publicUrl: 'https://cdn.example.com/launch.png',
            key: 'k',
          },
        ],
      },
      '',
    ]);
    const data = Buffer.from('png-bytes');
    const result = await uploadFileAction.run(
      actionContext({
        file: {
          filename: 'launch.png',
          extension: 'png',
          data,
          base64: data.toString('base64'),
        },
      })
    );
    expect(JSON.parse(JSON.stringify(sentRequest(spy, 0).body))).toEqual({
      files: [{ fileName: 'launch.png', mimeType: 'image/png' }],
    });
    expect(sentRequest(spy, 1)).toMatchObject({
      method: HttpMethod.PUT,
      url: 'https://storage.example.com/put',
      headers: { 'Content-Type': 'image/png' },
      body: data,
    });
    expect(result).toEqual({
      public_url: 'https://cdn.example.com/launch.png',
      file_name: 'launch.png',
      mime_type: 'image/png',
      key: 'k',
    });
  });

  it('Upload File rejects a type AdaptlyPost cannot post', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    const data = Buffer.from('x');
    await expect(
      uploadFileAction.run(
        actionContext({
          file: { filename: 'notes.txt', extension: 'txt', data, base64: '' },
        })
      )
    ).rejects.toThrow('.txt files');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('webhook triggers', () => {
  const secret = 'whsec_test';

  function triggerContext(
    store: ReturnType<typeof memoryStore>,
    payload?: ReturnType<typeof signedDelivery>
  ) {
    return {
      ...createMockActionContext({ propsValue: {} }),
      auth,
      store,
      webhookUrl: 'https://cloud.activepieces.com/api/v1/webhooks/flow_1',
      payload: payload ?? { body: {}, headers: {} },
    } as never;
  }

  it('registers a webhook for its events and keeps the id and secret', async () => {
    const spy = mockResponses([{ id: 'wh_1', secret }]);
    const store = memoryStore();
    await postFailedTrigger.onEnable(triggerContext(store));
    expect(sentRequest(spy).body).toEqual({
      url: 'https://cloud.activepieces.com/api/v1/webhooks/flow_1',
      events: ['post.failed', 'post.partially_failed'],
    });
    expect(store.values.get(adaptlyPostWebhook.STORE_KEY)).toEqual({
      id: 'wh_1',
      secret,
    });
  });

  it('removes the webhook on disable and treats an already deleted one as done', async () => {
    const store = memoryStore();
    await store.put(adaptlyPostWebhook.STORE_KEY, { id: 'wh_1', secret });
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockRejectedValueOnce(
        new HttpError({}, { status: 404, responseBody: {} })
      );
    await postPublishedTrigger.onDisable(triggerContext(store));
    expect(sentRequest(spy as never)).toMatchObject({
      method: HttpMethod.DELETE,
      url: `${BASE}/webhooks/wh_1`,
    });
    expect(store.values.has(adaptlyPostWebhook.STORE_KEY)).toBe(false);
  });

  it('emits a signed delivery for its event with a dedupe key', async () => {
    const store = memoryStore();
    await store.put(adaptlyPostWebhook.STORE_KEY, { id: 'wh_1', secret });
    const delivery = signedDelivery({
      secret,
      body: {
        id: 'evt_1',
        event: 'post.published',
        createdAt: '2026-11-01T09:05:12.000Z',
        data: { post: POST },
      },
    });
    const output = await postPublishedTrigger.run(
      triggerContext(store, delivery)
    );
    expect(output).toHaveLength(1);
    expect(output[0]).toMatchObject({
      event: 'post.published',
      event_id: 'evt_1',
      post_id: 'post_1',
      [DEDUPE_KEY_PROPERTY]: 'adaptlypost:evt_1',
    });
  });

  it('drops deliveries with a wrong signature, another event, or no raw body', async () => {
    const store = memoryStore();
    await store.put(adaptlyPostWebhook.STORE_KEY, { id: 'wh_1', secret });
    const body = {
      id: 'evt_1',
      event: 'post.published',
      createdAt: '2026-11-01T09:05:12.000Z',
      data: { post: POST },
    };
    const forged = signedDelivery({ secret: 'someone-else', body });
    const otherEvent = signedDelivery({
      secret,
      body: { ...body, event: 'webhook.test' },
    });
    const noRawBody = {
      ...signedDelivery({ secret, body }),
      rawBody: undefined,
    } as never;
    expect(
      await postPublishedTrigger.run(triggerContext(store, forged))
    ).toEqual([]);
    expect(
      await postPublishedTrigger.run(triggerContext(store, otherEvent))
    ).toEqual([]);
    expect(
      await postPublishedTrigger.run(triggerContext(store, noRawBody))
    ).toEqual([]);
  });
});

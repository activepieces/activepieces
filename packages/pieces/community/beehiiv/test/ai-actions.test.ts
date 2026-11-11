import { afterEach, describe, expect, test, vi } from 'vitest';
import { beehiiv } from '../src/index';
import { beehiivAiActions } from '../src/lib/actions/ai';
import { listSubscriptionsAiAction } from '../src/lib/actions/ai/list-subscriptions.action';
import { getSubscriptionAiAction } from '../src/lib/actions/ai/get-subscription.action';
import { createSubscriptionAiAction } from '../src/lib/actions/ai/create-subscription.action';
import { updateSubscriptionAiAction } from '../src/lib/actions/ai/update-subscription.action';
import { unsubscribeSubscriptionAiAction } from '../src/lib/actions/ai/unsubscribe-subscription.action';
import { deleteSubscriptionAiAction } from '../src/lib/actions/ai/delete-subscription.action';
import { addSubscriptionTagsAiAction } from '../src/lib/actions/ai/add-subscription-tags.action';
import { removeSubscriptionTagsAiAction } from '../src/lib/actions/ai/remove-subscription-tags.action';
import { getPostAiAction } from '../src/lib/actions/ai/get-post.action';
import { deletePostAiAction } from '../src/lib/actions/ai/delete-post.action';
import { createDraftPostAiAction } from '../src/lib/actions/ai/create-draft-post.action';
import { createSegmentAiAction } from '../src/lib/actions/ai/create-segment.action';
import { listPublicationsAiAction } from '../src/lib/actions/ai/list-publications.action';
import { getPublicationEngagementsAiAction } from '../src/lib/actions/ai/get-publication-engagements.action';
import { PUB, SUBSCRIPTION, actionContext, stubBeehiiv } from './helpers';

afterEach(() => vi.restoreAllMocks());

const ENCODED_EMAIL = 'odai%2Bbhtest1%40activepieces.com';

describe('AI atomics metadata', () => {
  test('every AI atomic is ai-only, has metadata, a schema, and no checkbox or dynamic dropdown props', () => {
    expect(beehiivAiActions).toHaveLength(22);
    for (const action of beehiivAiActions) {
      expect(action.audience).toBe('ai');
      expect(action.aiMetadata?.description?.length ?? 0).toBeGreaterThan(40);
      expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
      expect(action.outputSchema).toBeDefined();
      for (const prop of Object.values(action.props)) {
        expect(['CHECKBOX', 'DROPDOWN', 'MULTI_SELECT_DROPDOWN', 'DYNAMIC']).not.toContain(Reflect.get(Object(prop), 'type'));
      }
    }
  });

  test('action names are unique and every AI atomic is registered', () => {
    const names = Object.keys(beehiiv.actions());
    expect(new Set(names).size).toBe(names.length);
    expect(names).not.toContain('list_automations_ai');
    expect(names).not.toContain('list_posts_ai');
    expect(names).not.toContain('add_subscription_to_automation_ai');
    for (const action of beehiivAiActions) {
      expect(names).toContain(action.name);
    }
  });

  test('idempotent flags match the live repeat calls', () => {
    const flags = Object.fromEntries(beehiivAiActions.map((action) => [action.name, action.aiMetadata?.idempotent]));
    expect(flags['create_subscription_ai']).toBe(false);
    expect(flags['unsubscribe_subscription']).toBe(true);
    expect(flags['add_subscription_tags']).toBe(true);
    expect(flags['remove_subscription_tags']).toBe(true);
    expect(flags['delete_subscription_ai']).toBe(false);
    expect(flags['delete_post']).toBe(false);
  });
});

describe('subscriber identity', () => {
  test('rejects both or neither of Subscription ID and Email before any request', async () => {
    const seen = stubBeehiiv({ replies: [{ body: {} }] });
    await expect(getSubscriptionAiAction.run(actionContext({ propsValue: { publication_id: PUB, subscription_id: 'sub_1', email: 'a@x.com' } }))).rejects.toThrow('not both');
    await expect(getSubscriptionAiAction.run(actionContext({ propsValue: { publication_id: PUB } }))).rejects.toThrow('Provide either');
    expect(seen).toHaveLength(0);
  });

  test('Get Subscription by email uses the encoded by_email path and default expands', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: SUBSCRIPTION } }] });
    const result = await getSubscriptionAiAction.run(actionContext({ propsValue: { publication_id: PUB, email: SUBSCRIPTION.email } }));
    expect(seen[0].rawPath).toBe(`/v2/publications/${PUB}/subscriptions/by_email/${ENCODED_EMAIL}`);
    expect(seen[0].query.getAll('expand[]')).toEqual(['custom_fields', 'tags']);
    expect(result).toEqual(SUBSCRIPTION);
  });
});

describe('subscription writes', () => {
  test('Create Subscription (AI) maps yes/no, custom field object and arrays, and returns warnings', async () => {
    const seen = stubBeehiiv({ replies: [{ status: 201, body: { data: SUBSCRIPTION, warnings: [{ message: 'unknown', code: 'CUSTOM_FIELDS_UNKNOWN' }] } }] });
    const result = await createSubscriptionAiAction.run(
      actionContext({
        propsValue: {
          publication_id: PUB,
          email: SUBSCRIPTION.email,
          send_welcome_email: 'no',
          double_opt_override: 'off',
          custom_fields: { 'First Name': 'Ada', Score: 3, Interests: ['a'] },
          automation_ids: ['aut_1', 'aut_1'],
        },
      }),
    );
    expect(seen[0].body).toEqual({
      email: SUBSCRIPTION.email,
      send_welcome_email: false,
      double_opt_override: 'off',
      custom_fields: [
        { name: 'First Name', value: 'Ada' },
        { name: 'Score', value: 3 },
        { name: 'Interests', value: ['a'] },
      ],
      automation_ids: ['aut_1'],
    });
    expect(result).toEqual({ subscription: SUBSCRIPTION, warnings: [{ message: 'unknown', code: 'CUSTOM_FIELDS_UNKNOWN' }] });
  });

  test('Create Subscription (AI) rejects a nested custom field value', async () => {
    stubBeehiiv({ replies: [{ body: {} }] });
    await expect(createSubscriptionAiAction.run(actionContext({ propsValue: { publication_id: PUB, email: 'a@x.com', custom_fields: { Bad: { x: 1 } } } }))).rejects.toThrow('Bad');
  });

  test('Update Subscription (AI) sends only given fields, maps clears to delete:true, refuses set+clear and empty updates', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: SUBSCRIPTION } }] });
    await updateSubscriptionAiAction.run(
      actionContext({ propsValue: { publication_id: PUB, email: SUBSCRIPTION.email, custom_fields: { Company: 'Acme' }, clear_custom_fields: ['Score'] } }),
    );
    expect(seen[0].method).toBe('PUT');
    expect(seen[0].rawPath).toBe(`/v2/publications/${PUB}/subscriptions/by_email/${ENCODED_EMAIL}`);
    expect(seen[0].body).toEqual({ custom_fields: [{ name: 'Company', value: 'Acme' }, { name: 'Score', delete: true }] });
    await expect(
      updateSubscriptionAiAction.run(actionContext({ propsValue: { publication_id: PUB, subscription_id: 'sub_1', custom_fields: { A: 'x' }, clear_custom_fields: ['A'] } })),
    ).rejects.toThrow('both set and clear');
    await expect(updateSubscriptionAiAction.run(actionContext({ propsValue: { publication_id: PUB, subscription_id: 'sub_1' } }))).rejects.toThrow('Nothing to update');
    expect(seen).toHaveLength(1);
  });

  test('Unsubscribe sends unsubscribe:true by ID', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: { ...SUBSCRIPTION, status: 'inactive' } } }] });
    const result = await unsubscribeSubscriptionAiAction.run(actionContext({ propsValue: { publication_id: PUB, subscription_id: SUBSCRIPTION.id } }));
    expect(seen[0].path).toBe(`/v2/publications/${PUB}/subscriptions/${SUBSCRIPTION.id}`);
    expect(seen[0].body).toEqual({ unsubscribe: true });
    expect(result).toEqual({ subscription: { ...SUBSCRIPTION, status: 'inactive' } });
  });

  test('Delete Subscription (AI) by email looks up the ID first, then deletes it', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: SUBSCRIPTION } }, { status: 204 }] });
    const result = await deleteSubscriptionAiAction.run(actionContext({ propsValue: { publication_id: PUB, email: SUBSCRIPTION.email } }));
    expect(seen.map((r) => `${r.method} ${r.rawPath}`)).toEqual([
      `GET /v2/publications/${PUB}/subscriptions/by_email/${ENCODED_EMAIL}`,
      `DELETE /v2/publications/${PUB}/subscriptions/${SUBSCRIPTION.id}`,
    ]);
    expect(result).toEqual({ deleted: true, subscription_id: SUBSCRIPTION.id });
  });

  test('tags: add posts the list, remove sends DELETE with a JSON body', async () => {
    const seen = stubBeehiiv({ replies: [{ status: 201, body: { data: { ...SUBSCRIPTION, tags: ['vip'] } } }] });
    await addSubscriptionTagsAiAction.run(actionContext({ propsValue: { publication_id: PUB, subscription_id: SUBSCRIPTION.id, tags: ['vip', ' vip ', ''] } }));
    expect(seen[0].body).toEqual({ tags: ['vip'] });
    vi.restoreAllMocks();
    const removed = stubBeehiiv({ replies: [{ status: 204 }] });
    const result = await removeSubscriptionTagsAiAction.run(actionContext({ propsValue: { publication_id: PUB, subscription_id: SUBSCRIPTION.id, tags: ['vip'] } }));
    expect(removed[0].method).toBe('DELETE');
    expect(removed[0].path).toBe(`/v2/publications/${PUB}/subscriptions/${SUBSCRIPTION.id}/tags`);
    expect(removed[0].body).toEqual({ tags: ['vip'] });
    expect(result).toEqual({ subscription_id: SUBSCRIPTION.id, removed_tags: ['vip'] });
  });
});

describe('lists and posts', () => {
  test('List Subscriptions (AI) maps filters and returns cursor paging', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: [SUBSCRIPTION], has_more: true, next_cursor: 'c2' } }] });
    const result = await listSubscriptionsAiAction.run(
      actionContext({ propsValue: { publication_id: PUB, status: 'active', created_on: '2026-11-10', include: ['tags'], order: 'oldest_first', cursor: 'c1' } }),
    );
    expect(seen[0].query.get('creation_date')).toBe('2026/11/10');
    expect(seen[0].query.get('direction')).toBe('asc');
    expect(seen[0].query.get('cursor')).toBe('c1');
    expect(seen[0].query.get('limit')).toBe('25');
    expect(seen[0].query.getAll('expand[]')).toEqual(['tags']);
    expect(result).toEqual({ items: [SUBSCRIPTION], next_cursor: 'c2', has_more: true });
  });

  test('limits are validated', async () => {
    stubBeehiiv({ replies: [{ body: {} }] });
    await expect(listPublicationsAiAction.run(actionContext({ propsValue: { limit: 101 } }))).rejects.toThrow('between 1 and 100');
  });

  test('Get Post rejects unknown include values', async () => {
    stubBeehiiv({ replies: [{ body: {} }] });
    await expect(getPostAiAction.run(actionContext({ propsValue: { publication_id: PUB, post_id: 'post_1', include: ['everything'] } }))).rejects.toThrow('unknown values');
  });

  test('Delete Post reports archived for a confirmed post and deleted for a draft', async () => {
    stubBeehiiv({ replies: [{ body: { data: { id: 'post_1', status: 'confirmed' } } }, { status: 204 }] });
    expect(await deletePostAiAction.run(actionContext({ propsValue: { publication_id: PUB, post_id: 'post_1' } }))).toEqual({
      post_id: 'post_1',
      result: 'archived',
      previous_status: 'confirmed',
    });
    vi.restoreAllMocks();
    stubBeehiiv({ replies: [{ body: { data: { id: 'post_2', status: 'draft' } } }, { status: 204 }] });
    expect(await deletePostAiAction.run(actionContext({ propsValue: { publication_id: PUB, post_id: 'post_2' } }))).toEqual({
      post_id: 'post_2',
      result: 'deleted',
      previous_status: 'draft',
    });
  });

  test('Create Draft Post always sends status draft and needs an https thumbnail', async () => {
    const seen = stubBeehiiv({ replies: [{ status: 201, body: { data: { id: 'post_9', preview_url: 'https://x/p' } } }] });
    const result = await createDraftPostAiAction.run(actionContext({ propsValue: { publication_id: PUB, title: 'T', body_html: '<p>Hi</p>' } }));
    expect(seen[0].body).toEqual({ title: 'T', body_content: '<p>Hi</p>', status: 'draft' });
    expect(result).toEqual({ id: 'post_9', preview_url: 'https://x/p', status: 'draft' });
    await expect(
      createDraftPostAiAction.run(actionContext({ propsValue: { publication_id: PUB, title: 'T', body_html: 'x', thumbnail_image_url: 'http://x' } })),
    ).rejects.toThrow('https');
  });

  test('Create Segment needs exactly one of emails or subscription IDs', async () => {
    const seen = stubBeehiiv({ replies: [{ status: 201, body: { data: { id: 'seg_1' } } }] });
    await createSegmentAiAction.run(actionContext({ propsValue: { publication_id: PUB, name: 'VIP', emails: ['a@x.com'] } }));
    expect(seen[0].body).toEqual({ name: 'VIP', input: { type: 'emails', emails: ['a@x.com'] } });
    await expect(createSegmentAiAction.run(actionContext({ propsValue: { publication_id: PUB, name: 'VIP' } }))).rejects.toThrow(/^Provide Emails or Subscription IDs\.$/);
    await expect(
      createSegmentAiAction.run(actionContext({ propsValue: { publication_id: PUB, name: 'VIP', emails: ['a@x.com'], subscription_ids: ['sub_1'] } })),
    ).rejects.toThrow('Provide either Emails or Subscription IDs, not both.');
    expect(seen).toHaveLength(1);
  });

  test('Get Engagement Stats validates the date and returns items', async () => {
    stubBeehiiv({ replies: [{ body: { data: [{ date: '2026-11-09', total_opens: 1 }], publication_id: PUB, granularity: 'day' } }] });
    const result = await getPublicationEngagementsAiAction.run(actionContext({ propsValue: { publication_id: PUB } }));
    expect(result).toEqual({ publication_id: PUB, granularity: 'day', items: [{ date: '2026-11-09', total_opens: 1 }] });
    await expect(getPublicationEngagementsAiAction.run(actionContext({ propsValue: { publication_id: PUB, start_date: '11/09/2026' } }))).rejects.toThrow('YYYY-MM-DD');
  });
});

describe('QA: MCP-gap atomics and edge cases', () => {
  test('Create Custom Field posts display + kind and rejects an unknown kind before any request', async () => {
    const { createCustomFieldAiAction } = await import('../src/lib/actions/ai/create-custom-field.action');
    const seen = stubBeehiiv({ replies: [{ status: 201, body: { data: { id: 'cf_1', kind: 'double', display: 'Score' } } }] });
    const result = await createCustomFieldAiAction.run(actionContext({ propsValue: { publication_id: PUB, name: ' Score ', kind: 'double' } }));
    expect(seen[0].method).toBe('POST');
    expect(seen[0].path).toBe(`/v2/publications/${PUB}/custom_fields`);
    expect(seen[0].body).toEqual({ display: 'Score', kind: 'double' });
    expect(result).toEqual({ id: 'cf_1', kind: 'double', display: 'Score' });
    await expect(createCustomFieldAiAction.run(actionContext({ propsValue: { publication_id: PUB, name: 'X', kind: 'float' } }))).rejects.toThrow('Kind must be one of');
    expect(seen).toHaveLength(1);
  });

  test('Create Segment by subscription IDs uses the subscriptions input and caps at 1,000 entries', async () => {
    const seen = stubBeehiiv({ replies: [{ status: 201, body: { data: { id: 'seg_1' } } }] });
    await createSegmentAiAction.run(actionContext({ propsValue: { publication_id: PUB, name: 'VIP', subscription_ids: ['sub_1', 'sub_2'] } }));
    expect(seen[0].body).toEqual({ name: 'VIP', input: { type: 'subscriptions', subscriptions: ['sub_1', 'sub_2'] } });
    const tooMany = Array.from({ length: 1001 }, (_, index) => `u${index}@x.com`);
    await expect(createSegmentAiAction.run(actionContext({ propsValue: { publication_id: PUB, name: 'VIP', emails: tooMany } }))).rejects.toThrow('at most 1000');
    await expect(
      createSegmentAiAction.run(actionContext({ propsValue: { publication_id: PUB, name: 'VIP', emails: ['a@x.com'], subscription_ids: ['sub_1'] } })),
    ).rejects.toThrow('not both');
    expect(seen).toHaveLength(1);
  });

  test('List Post Templates calls /post_templates with page and limit and returns offset paging', async () => {
    const { listPostTemplatesAiAction } = await import('../src/lib/actions/ai/list-post-templates.action');
    const seen = stubBeehiiv({ replies: [{ body: { data: [{ id: 'tmpl_1', name: 'Weekly' }], page: 2, limit: 10, total_pages: 3, total_results: 21 } }] });
    const result = await listPostTemplatesAiAction.run(actionContext({ propsValue: { publication_id: PUB, page: 2, limit: 10 } }));
    expect(seen[0].path).toBe(`/v2/publications/${PUB}/post_templates`);
    expect(seen[0].query.get('page')).toBe('2');
    expect(seen[0].query.get('limit')).toBe('10');
    expect(result).toEqual({ items: [{ id: 'tmpl_1', name: 'Weekly' }], page: 2, limit: 10, total_pages: 3, total_results: 21, has_more: true });
  });

  test('Get Engagement Stats maps every query param and rejects out-of-range days before any request', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: [] } }] });
    await getPublicationEngagementsAiAction.run(
      actionContext({ propsValue: { publication_id: PUB, start_date: '2026-11-01', number_of_days: 31, granularity: 'week', email_type: 'post' } }),
    );
    expect(seen[0].path).toBe(`/v2/publications/${PUB}/engagements`);
    expect(Object.fromEntries(seen[0].query.entries())).toEqual({ start_date: '2026-11-01', number_of_days: '31', granularity: 'week', email_type: 'post' });
    await expect(getPublicationEngagementsAiAction.run(actionContext({ propsValue: { publication_id: PUB, number_of_days: 32 } }))).rejects.toThrow('between 1 and 31');
    await expect(getPublicationEngagementsAiAction.run(actionContext({ propsValue: { publication_id: PUB, granularity: 'year' } }))).rejects.toThrow('Granularity');
    expect(seen).toHaveLength(1);
  });

  test('Get Engagement Stats returns empty items when beehiiv returns no data array', async () => {
    stubBeehiiv({ replies: [{ body: { publication_id: PUB } }] });
    expect(await getPublicationEngagementsAiAction.run(actionContext({ propsValue: { publication_id: PUB } }))).toEqual({ publication_id: PUB, items: [] });
  });

  test('List Publications sends expand[]=stats only when asked', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: [], total_pages: 0 } }] });
    await listPublicationsAiAction.run(actionContext({ propsValue: { include_stats: 'yes' } }));
    await listPublicationsAiAction.run(actionContext({ propsValue: { include_stats: 'no' } }));
    expect(seen[0].query.getAll('expand[]')).toEqual(['stats']);
    expect([...seen[1].query.keys()].some((key) => key.startsWith('expand'))).toBe(false);
    await expect(listPublicationsAiAction.run(actionContext({ propsValue: { include_stats: 'maybe' } }))).rejects.toThrow('"yes" or "no"');
  });

  test('Delete Post reports pending when the DELETE returns 202', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: { id: 'post_1', status: 'confirmed' } } }, { status: 202, body: {} }] });
    const result = await deletePostAiAction.run(actionContext({ propsValue: { publication_id: PUB, post_id: 'post_1' } }));
    expect(seen.map((request) => request.method)).toEqual(['GET', 'DELETE']);
    expect(result).toEqual({ post_id: 'post_1', result: 'pending', previous_status: 'confirmed' });
  });

  test('Delete Subscription (AI) by email surfaces the 404 and never sends the DELETE', async () => {
    const seen = stubBeehiiv({ replies: [{ status: 404, body: { errors: [{ message: 'Record not found', code: 'RECORD_NOT_FOUND' }] } }] });
    await expect(deleteSubscriptionAiAction.run(actionContext({ propsValue: { publication_id: PUB, email: SUBSCRIPTION.email } }))).rejects.toThrow('RECORD_NOT_FOUND');
    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe('GET');
  });

  test('a write that hits 429 fails once with the plan limits and is not retried', async () => {
    const seen = stubBeehiiv({ replies: [{ status: 429, headers: { 'ratelimit-reset': '1' }, body: { errors: [{ message: 'Too many requests' }] } }] });
    await expect(
      unsubscribeSubscriptionAiAction.run(actionContext({ propsValue: { publication_id: PUB, subscription_id: SUBSCRIPTION.id } })),
    ).rejects.toThrow('Free 30, Lite 180, Pro 500');
    expect(seen).toHaveLength(1);
  });

  test('Get Subscription with an explicit include sends only that expand', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: SUBSCRIPTION } }] });
    await getSubscriptionAiAction.run(actionContext({ propsValue: { publication_id: PUB, subscription_id: SUBSCRIPTION.id, include: ['stats'] } }));
    expect(seen[0].path).toBe(`/v2/publications/${PUB}/subscriptions/${SUBSCRIPTION.id}`);
    expect(seen[0].query.getAll('expand[]')).toEqual(['stats']);
  });
});

describe('QA round 2: limit modelled and Create Segment messages', () => {
  test('every schema with paging totals also models limit', () => {
    const withTotals = Object.values(beehiiv.actions()).filter((action) => (action.outputSchema?.fields ?? []).some((field) => field.key === 'total_pages'));
    expect(withTotals.length).toBe(8);
    for (const action of withTotals) {
      expect((action.outputSchema?.fields ?? []).map((field) => field.key)).toContain('limit');
    }
    const humanList = beehiiv.actions()['list_subscriptions'].outputSchema;
    expect(humanList?.fields).toHaveLength(1);
    expect(humanList?.fields[0]).toMatchObject({ value: '' });
  });

  test('List Publications returned keys are all modelled', async () => {
    stubBeehiiv({ replies: [{ body: { data: [{ id: PUB, name: 'P' }], page: 1, limit: 25, total_pages: 1, total_results: 1 } }] });
    const result = await listPublicationsAiAction.run(actionContext({ propsValue: {} }));
    const schemaKeys = (listPublicationsAiAction.outputSchema?.fields ?? []).map((field) => field.key);
    expect(Object.keys(Object(result)).sort()).toEqual([...schemaKeys].sort());
  });

  test('Create Segment: empty lists count as missing, one empty plus one set uses the set list', async () => {
    const seen = stubBeehiiv({ replies: [{ status: 201, body: { data: { id: 'seg_1' } } }] });
    await expect(createSegmentAiAction.run(actionContext({ propsValue: { publication_id: PUB, name: 'VIP', emails: [], subscription_ids: [' '] } }))).rejects.toThrow(
      /^Provide Emails or Subscription IDs\.$/,
    );
    expect(seen).toHaveLength(0);
    await createSegmentAiAction.run(actionContext({ propsValue: { publication_id: PUB, name: 'VIP', emails: [], subscription_ids: ['sub_1'] } }));
    expect(seen[0].body).toEqual({ name: 'VIP', input: { type: 'subscriptions', subscriptions: ['sub_1'] } });
  });
});

describe('Live-test fixes', () => {
  test('Create Custom Field returns the unwrapped 201 body beehiiv sends live', async () => {
    const { createCustomFieldAiAction } = await import('../src/lib/actions/ai/create-custom-field.action');
    const live = { id: '3a6e0ebc-16fa-4468-adcf-30119618f4bc', kind: 'string', display: 'ap-live-test Raw', created: 1794295097 };
    stubBeehiiv({ replies: [{ status: 201, body: live }] });
    const result = await createCustomFieldAiAction.run(actionContext({ propsValue: { publication_id: PUB, name: 'ap-live-test Raw', kind: 'string' } }));
    expect(result).toEqual(live);
    const schemaKeys = (createCustomFieldAiAction.outputSchema?.fields ?? []).map((field) => field.key);
    for (const key of Object.keys(live)) {
      expect(schemaKeys).toContain(key);
    }
  });

  test('wrapped responses still unwrap data, and a null data wrapper yields an empty object', async () => {
    stubBeehiiv({ replies: [{ status: 201, body: { data: { id: 'seg_1', name: 'VIP', type: 'manual' } } }] });
    expect(await createSegmentAiAction.run(actionContext({ propsValue: { publication_id: PUB, name: 'VIP', subscription_ids: ['sub_1'] } }))).toEqual({
      id: 'seg_1',
      name: 'VIP',
      type: 'manual',
    });
    vi.restoreAllMocks();
    stubBeehiiv({ replies: [{ body: { data: null } }] });
    expect(await getPostAiAction.run(actionContext({ propsValue: { publication_id: PUB, post_id: 'post_1' } }))).toEqual({});
  });

  test('subscription schema covers referrals returned when include=referrals', async () => {
    const live = { ...SUBSCRIPTION, custom_fields: [], referrals: [], tags: [] };
    stubBeehiiv({ replies: [{ body: { data: live } }] });
    const result = await getSubscriptionAiAction.run(
      actionContext({ propsValue: { publication_id: PUB, email: SUBSCRIPTION.email, include: ['custom_fields', 'tags', 'stats', 'referrals', 'newsletter_lists'] } }),
    );
    expect(result).toEqual(live);
    const schemaKeys = (getSubscriptionAiAction.outputSchema?.fields ?? []).map((field) => field.key);
    expect(schemaKeys).toContain('referrals');
  });

  test('Get Aggregate Post Stats maps the live 500 NO_METHOD to a no-posts message without retrying', async () => {
    const { getAggregatePostStatsAiAction } = await import('../src/lib/actions/ai/get-aggregate-post-stats.action');
    const seen = stubBeehiiv({
      replies: [
        {
          status: 500,
          body: { status: 500, statusText: 'internal_server_error', errors: [{ message: 'An error occurred while processing your request.', code: 'NO_METHOD' }] },
        },
      ],
    });
    const error = await getAggregatePostStatsAiAction.run(actionContext({ propsValue: { publication_id: PUB } })).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).toContain('publication has no posts yet');
    expect(String(error)).not.toContain('retry later');
    expect(seen).toHaveLength(1);
  });

  test('Get Aggregate Post Stats keeps other server errors and 404s unchanged', async () => {
    const { getAggregatePostStatsAiAction } = await import('../src/lib/actions/ai/get-aggregate-post-stats.action');
    stubBeehiiv({ replies: [{ status: 500, body: { errors: [{ message: 'boom', code: 'INTERNAL' }] } }] });
    await expect(getAggregatePostStatsAiAction.run(actionContext({ propsValue: { publication_id: PUB } }))).rejects.toThrow('beehiiv server error; retry later');
    vi.restoreAllMocks();
    stubBeehiiv({ replies: [{ status: 404, body: { status: 404, statusText: 'not_found', errors: [{ message: "Couldn't find publication", code: 'RECORD_NOT_FOUND' }] } }] });
    await expect(getAggregatePostStatsAiAction.run(actionContext({ propsValue: { publication_id: PUB } }))).rejects.toThrow('HTTP 404');
  });
});

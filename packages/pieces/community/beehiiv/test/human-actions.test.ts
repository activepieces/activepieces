import { afterEach, describe, expect, test, vi } from 'vitest';
import { createSubscriptionAction } from '../src/lib/actions/create-subscription.action';
import { updateSubscriptionAction } from '../src/lib/actions/update-subscription.action';
import { deleteSubscriptionAction } from '../src/lib/actions/delete-subscription.action';
import { listSubscriptionsAction } from '../src/lib/actions/list-subscriptions.action';
import { addSubscriptionToAutomationAction } from '../src/lib/actions/add-subscription-to-automation.action';
import { listAutomationsAction } from '../src/lib/actions/list-automations.action';
import { listPostsAction } from '../src/lib/actions/list-posts.action';
import { beehiiv } from '../src/index';
import { PUB, SUBSCRIPTION, actionContext, stubBeehiiv } from './helpers';

const JOURNEY = {
  id: 'aj_f1e2d3c4-0000-4000-8000-000000000001',
  automation_id: 'aut_1',
  subscription_id: SUBSCRIPTION.id,
  status: 'in_progress',
  started_at: 1794297585,
  completed_at: 0,
};

afterEach(() => vi.restoreAllMocks());

describe('human actions keep their names and props, and are human-only', () => {
  test('names, audience and prop names are unchanged', () => {
    const expected: Record<string, string[]> = {
      create_subscription: ['publicationId', 'email', 'reactivate_existing', 'send_welcome_email', 'utm_source', 'utm_medium', 'utm_campaign', 'referring_site', 'referral_code', 'tier', 'custom_fields', 'stripe_customer_id', 'double_opt_override', 'premium_tier_ids', 'automation_ids'],
      update_subscription: ['publicationId', 'subscriptionId', 'tier', 'stripe_customer_id', 'unsubscribe', 'custom_fields'],
      delete_subscription: ['publicationId', 'subscriptionId'],
      list_subscriptions: ['publicationId', 'status', 'limit', 'cursor'],
      add_subscription_to_automation: ['publicationId', 'automationId', 'email', 'subscription_id', 'double_opt_override'],
      list_automations: ['publicationId', 'limit', 'page'],
      list_posts: ['publicationId', 'expand', 'audience', 'platform', 'status', 'content_tags', 'slugs', 'order_by', 'direction', 'limit', 'page'],
    };
    const actions = beehiiv.actions();
    for (const [name, props] of Object.entries(expected)) {
      expect(Object.keys(actions[name].props)).toEqual(props);
      expect(actions[name].audience).toBe(BOTH_AUDIENCE.includes(name) ? 'both' : 'human');
      expect(actions[name].outputSchema).toBeDefined();
    }
    expect(Reflect.get(Object(actions['create_subscription'].props['automation_ids']), 'type')).toBe('DROPDOWN');
  });

  test('piece requires 0.88.2 and only Add Subscription to Automation, List Automations and List Posts serve both audiences', () => {
    expect(beehiiv.minimumSupportedRelease).toBe('0.88.2');
    const both = Object.values(beehiiv.actions()).filter((action) => action.audience === 'both');
    expect(both.map((action) => action.name).sort()).toEqual([...BOTH_AUDIENCE].sort());
    for (const action of both.filter((action) => action.name !== 'add_subscription_to_automation')) {
      expect(action.aiMetadata?.description).toContain('Page + 1');
      expect(action.aiMetadata?.idempotent).toBe(true);
    }
    const automation = beehiiv.actions()['add_subscription_to_automation'];
    expect(automation.aiMetadata?.idempotent).toBe(false);
    expect(automation.aiMetadata?.description).toContain('exactly one of Subscription Email or Subscription ID');
    expect(automation.aiMetadata?.description).toContain('"api" in its trigger_events');
  });
});

describe('human action requests', () => {
  test('List Posts calls /posts with bracketed tags and expand, not /automations', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: [{ id: 'post_1' }], total_pages: 1 } }] });
    const result = await listPostsAction.run(
      actionContext({ propsValue: { publicationId: PUB, audience: 'all', platform: 'all', status: 'confirmed', expand: ['stats', 'free_web_content'], content_tags: ['a', 'b'] } }),
    );
    expect(seen[0].path).toBe(`/v2/publications/${PUB}/posts`);
    expect(seen[0].query.getAll('content_tags[]')).toEqual(['a', 'b']);
    expect(seen[0].query.getAll('expand[]')).toEqual(['stats', 'free_web_content']);
    expect(seen[0].query.has('expand')).toBe(false);
    expect(seen[0].query.get('order_by')).toBe('created');
    expect(seen[0].query.get('direction')).toBe('desc');
    expect(result).toEqual({ items: [{ id: 'post_1' }], total_results: 1, has_more: false });
  });

  test('List Posts sends no expand param when none is chosen, and page mode returns paging info', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: [{ id: 'post_1' }], total_pages: 4, total_results: 4 } }] });
    const result = await listPostsAction.run(actionContext({ propsValue: { publicationId: PUB, audience: 'all', platform: 'all', status: 'all', limit: 1 } }));
    expect([...seen[0].query.keys()].some((key) => key.startsWith('expand'))).toBe(false);
    expect(seen[0].query.get('limit')).toBe('1');
    expect(seen[0].query.get('page')).toBe('1');
    expect(result).toEqual({ items: [{ id: 'post_1' }], page: 1, limit: 1, total_pages: 4, total_results: 4, has_more: true });
  });

  test('List Posts sends slugs, order and direction, and validates them and the page range before any request', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: [], total_pages: 0, total_results: 0 } }] });
    await listPostsAction.run(
      actionContext({ propsValue: { publicationId: PUB, audience: 'free', platform: 'web', status: 'confirmed', slugs: ['s1', 's2'], order_by: 'publish_date', direction: 'asc', page: 2 } }),
    );
    expect(seen[0].query.getAll('slugs[]')).toEqual(['s1', 's2']);
    expect(seen[0].query.get('order_by')).toBe('publish_date');
    expect(seen[0].query.get('direction')).toBe('asc');
    expect(seen[0].query.get('page')).toBe('2');
    expect(seen[0].query.get('limit')).toBe('10');
    await expect(listPostsAction.run(actionContext({ propsValue: { publicationId: PUB, audience: 'all', platform: 'all', status: 'all', direction: 'up' } }))).rejects.toThrow('Direction must be one of');
    await expect(listPostsAction.run(actionContext({ propsValue: { publicationId: PUB, audience: 'all', platform: 'all', status: 'all', limit: 500 } }))).rejects.toThrow('between 1 and 100');
    expect(seen).toHaveLength(1);
  });

  test('List Automations page mode keeps the bare data array output', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: [{ id: 'aut_1' }], total_pages: 3 } }] });
    const result = await listAutomationsAction.run(actionContext({ propsValue: { publicationId: PUB, limit: 1, page: 2 } }));
    expect(seen[0].query.get('page')).toBe('2');
    expect(result).toEqual([{ id: 'aut_1' }]);
  });

  test('Create Subscription sends automation_ids as an array, drops empty custom fields, and validates double opt-in', async () => {
    const seen = stubBeehiiv({ replies: [{ status: 201, body: { data: SUBSCRIPTION, warnings: [{ message: 'x', code: 'CUSTOM_FIELDS_UNKNOWN' }] } }] });
    const result = await createSubscriptionAction.run(
      actionContext({ propsValue: { publicationId: PUB, email: SUBSCRIPTION.email, automation_ids: 'aut_1', double_opt_override: 'Off', custom_fields: { Company: 'Acme', Empty: '' } } }),
    );
    expect(seen[0].method).toBe('POST');
    expect(seen[0].body).toEqual({ email: SUBSCRIPTION.email, double_opt_override: 'off', automation_ids: ['aut_1'], custom_fields: [{ name: 'Company', value: 'Acme' }] });
    expect(result).toEqual({ data: SUBSCRIPTION, warnings: [{ message: 'x', code: 'CUSTOM_FIELDS_UNKNOWN' }] });
    vi.restoreAllMocks();
    const none = stubBeehiiv({ replies: [{ body: {} }] });
    await expect(createSubscriptionAction.run(actionContext({ propsValue: { publicationId: PUB, email: 'a@x.com', double_opt_override: 'maybe' } }))).rejects.toThrow('on, off, not_set');
    expect(none).toHaveLength(0);
  });

  test('Update Subscription sends unsubscribe only when checked, and never logs', async () => {
    const log = vi.spyOn(console, 'log');
    const seen = stubBeehiiv({ replies: [{ body: { data: SUBSCRIPTION } }] });
    await updateSubscriptionAction.run(actionContext({ propsValue: { publicationId: PUB, subscriptionId: SUBSCRIPTION.id, unsubscribe: false, tier: 'free', custom_fields: { Company: 'Acme', Blank: '', VIP: undefined, Active: false } } }));
    expect(seen[0].method).toBe('PUT');
    expect(seen[0].path).toBe(`/v2/publications/${PUB}/subscriptions/${SUBSCRIPTION.id}`);
    expect(seen[0].body).toEqual({ tier: 'free', custom_fields: [{ name: 'Company', value: 'Acme' }, { name: 'Active', value: false }] });
    expect(log).not.toHaveBeenCalled();
  });

  test('Delete Subscription returns the deleted ID after the 204', async () => {
    const seen = stubBeehiiv({ replies: [{ status: 204 }] });
    const result = await deleteSubscriptionAction.run(actionContext({ propsValue: { publicationId: PUB, subscriptionId: SUBSCRIPTION.id } }));
    expect(seen[0].method).toBe('DELETE');
    expect(result).toEqual({ deleted: true, subscription_id: SUBSCRIPTION.id });
  });

  test('List Subscriptions all-results mode stops at 5,000 with an error', async () => {
    const page = Array.from({ length: 100 }, (_, index) => ({ id: `sub_${index}` }));
    stubBeehiiv({ replies: [{ body: { data: page, has_more: true, next_cursor: 'next' } }] });
    await expect(listSubscriptionsAction.run(actionContext({ propsValue: { publicationId: PUB } }))).rejects.toThrow('more than 5000');
  });

  test('List Subscriptions page mode returns the raw page with the cursor', async () => {
    const body = { data: [SUBSCRIPTION], limit: 1, has_more: true, next_cursor: 'abc' };
    const seen = stubBeehiiv({ replies: [{ body }] });
    const result = await listSubscriptionsAction.run(actionContext({ propsValue: { publicationId: PUB, limit: 1, status: 'active' } }));
    expect(seen[0].query.get('status')).toBe('active');
    expect(result).toEqual(body);
  });

  test('Add Subscription to Automation posts to journeys and still accepts both email and ID', async () => {
    const seen = stubBeehiiv({ replies: [{ body: JOURNEY }] });
    const result = await addSubscriptionToAutomationAction.run(actionContext({ propsValue: { publicationId: PUB, automationId: 'aut_1', email: 'a@x.com', subscription_id: SUBSCRIPTION.id } }));
    expect(seen[0].path).toBe(`/v2/publications/${PUB}/automations/aut_1/journeys`);
    expect(seen[0].body).toEqual({ email: 'a@x.com', subscription_id: SUBSCRIPTION.id });
    expect(result).toEqual(JOURNEY);
  });

  test('Add Subscription to Automation schema models the unwrapped journey exactly', async () => {
    stubBeehiiv({ replies: [{ body: JOURNEY }] });
    const result = await addSubscriptionToAutomationAction.run(actionContext({ propsValue: { publicationId: PUB, automationId: 'aut_1', subscription_id: SUBSCRIPTION.id } }));
    const schemaKeys = (addSubscriptionToAutomationAction.outputSchema?.fields ?? []).map((field) => field.key);
    expect([...schemaKeys].sort()).toEqual(Object.keys(Object(result)).sort());
  });

  test('Add Subscription to Automation passes a data-wrapped body through unchanged', async () => {
    const wrapped = { data: JOURNEY };
    stubBeehiiv({ replies: [{ body: wrapped }] });
    const result = await addSubscriptionToAutomationAction.run(actionContext({ propsValue: { publicationId: PUB, automationId: 'aut_1', subscription_id: SUBSCRIPTION.id } }));
    expect(result).toEqual(wrapped);
  });

  test('List Automations schema models every key of a live automation item', () => {
    const items = listAutomationsAction.outputSchema?.fields.find((field) => field.key === 'items')?.listItems ?? [];
    const itemKeys = items.map((field) => field.key);
    for (const key of ['id', 'name', 'status', 'trigger_events', 'description', 'newsletter_list_id']) {
      expect(itemKeys).toContain(key);
    }
  });

  test('List Automations all mode pages to the end', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: [{ id: 'a1' }], total_pages: 2 } }, { body: { data: [{ id: 'a2' }], total_pages: 2 } }] });
    const result = await listAutomationsAction.run(actionContext({ propsValue: { publicationId: PUB } }));
    expect(seen).toHaveLength(2);
    expect(result).toEqual([{ id: 'a1' }, { id: 'a2' }]);
  });
});

describe('QA: human action edge cases', () => {
  test('Add Subscription to Automation with neither email nor ID fails before any request', async () => {
    const seen = stubBeehiiv({ replies: [{ body: {} }] });
    await expect(addSubscriptionToAutomationAction.run(actionContext({ propsValue: { publicationId: PUB, automationId: 'aut_1' } }))).rejects.toThrow(
      'Either Subscription Email or Subscription ID',
    );
    expect(seen).toHaveLength(0);
  });

  test('Update Subscription with no fields still sends the empty PUT that main sent', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: SUBSCRIPTION } }] });
    await updateSubscriptionAction.run(actionContext({ propsValue: { publicationId: PUB, subscriptionId: SUBSCRIPTION.id } }));
    expect(seen[0].body).toEqual({});
    vi.restoreAllMocks();
    const checked = stubBeehiiv({ replies: [{ body: { data: SUBSCRIPTION } }] });
    await updateSubscriptionAction.run(actionContext({ propsValue: { publicationId: PUB, subscriptionId: SUBSCRIPTION.id, unsubscribe: true } }));
    expect(checked[0].body).toEqual({ unsubscribe: true });
  });

  test('List Automations all mode stops past page 100 instead of truncating', async () => {
    const page = Array.from({ length: 100 }, (_, index) => ({ id: `aut_${index}` }));
    const seen = stubBeehiiv({ replies: [{ body: { data: page, total_pages: 150 } }] });
    await expect(listAutomationsAction.run(actionContext({ propsValue: { publicationId: PUB } }))).rejects.toThrow('more than');
    expect(seen.length).toBeLessThanOrEqual(101);
  });

  test('List Posts page mode returns no items on a malformed body instead of crashing', async () => {
    stubBeehiiv({ replies: [{ body: { unexpected: true } }] });
    expect(await listPostsAction.run(actionContext({ propsValue: { publicationId: PUB, audience: 'all', platform: 'all', status: 'all', page: 1 } }))).toEqual({
      items: [],
      page: 1,
      limit: 10,
      total_pages: 1,
      total_results: 0,
      has_more: false,
    });
  });

  test('Delete Subscription encodes the subscription ID in the path', async () => {
    const seen = stubBeehiiv({ replies: [{ status: 204 }] });
    await deleteSubscriptionAction.run(actionContext({ propsValue: { publicationId: PUB, subscriptionId: 'sub/../x' } }));
    expect(seen[0].rawPath).toBe(`/v2/publications/${PUB}/subscriptions/sub%2F..%2Fx`);
  });
});

const BOTH_AUDIENCE = ['add_subscription_to_automation', 'list_automations', 'list_posts'];

describe('QA round 2: both-audience lists', () => {
  test('List Posts with the new props empty or cleared sends exactly the old query', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: [], total_pages: 0, total_results: 0 } }] });
    await listPostsAction.run(
      actionContext({ propsValue: { publicationId: PUB, audience: 'all', platform: 'all', status: 'all', slugs: [], order_by: '', direction: null, limit: 5 } }),
    );
    expect(seen[0].query.get('order_by')).toBe('created');
    expect(seen[0].query.get('direction')).toBe('desc');
    expect(seen[0].query.has('slugs[]')).toBe(false);
    expect([...seen[0].query.keys()].sort()).toEqual(['audience', 'direction', 'limit', 'order_by', 'page', 'platform', 'status']);
    expect(seen[0].query.get('page')).toBe('1');
  });

  test('List Posts rejects an unknown Order By and a fractional Page before any request', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: [] } }] });
    await expect(listPostsAction.run(actionContext({ propsValue: { publicationId: PUB, audience: 'all', platform: 'all', status: 'all', order_by: 'title' } }))).rejects.toThrow('Order By must be one of');
    await expect(listPostsAction.run(actionContext({ propsValue: { publicationId: PUB, audience: 'all', platform: 'all', status: 'all', page: 1.5 } }))).rejects.toThrow();
    expect(seen).toHaveLength(0);
  });

  test('List Posts output keys are all modelled in its output schema, in both modes', async () => {
    const schemaKeys = (listPostsAction.outputSchema?.fields ?? []).map((field) => field.key);
    stubBeehiiv({ replies: [{ body: { data: [{ id: 'p1' }], total_pages: 2, total_results: 2 } }] });
    const page = await listPostsAction.run(actionContext({ propsValue: { publicationId: PUB, audience: 'all', platform: 'all', status: 'all', limit: 1, page: 1 } }));
    vi.restoreAllMocks();
    stubBeehiiv({ replies: [{ body: { data: [{ id: 'p1' }], total_pages: 1 } }] });
    const all = await listPostsAction.run(actionContext({ propsValue: { publicationId: PUB, audience: 'all', platform: 'all', status: 'all' } }));
    for (const result of [page, all]) {
      for (const key of Object.keys(Object(result))) {
        expect(schemaKeys).toContain(key);
      }
    }
  });

  test('List Posts fetch-all caps at 1,000 posts when Expand Results includes content, 10,000 otherwise', async () => {
    const fullPage = { data: Array.from({ length: 100 }, (_, index) => ({ id: `p${index}` })), total_pages: 12, total_results: 1200 };
    stubBeehiiv({ replies: [{ body: fullPage }] });
    await expect(
      listPostsAction.run(actionContext({ propsValue: { publicationId: PUB, audience: 'all', platform: 'all', status: 'all', expand: ['stats', 'free_web_content'] } })),
    ).rejects.toThrow('more than 1000 items');
    vi.restoreAllMocks();
    stubBeehiiv({ replies: [{ body: fullPage }] });
    const statsOnly = await listPostsAction.run(actionContext({ propsValue: { publicationId: PUB, audience: 'all', platform: 'all', status: 'all', expand: ['stats'] } }));
    expect(statsOnly.items).toHaveLength(1200);
  });

  test('List Automations all-results mode still returns a bare array', async () => {
    stubBeehiiv({ replies: [{ body: { data: [{ id: 'aut_1' }], total_pages: 1 } }] });
    const result = await listAutomationsAction.run(actionContext({ propsValue: { publicationId: PUB } }));
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([{ id: 'aut_1' }]);
  });

  test('agent-visible tools: unique names and display names, one post lister, one automation lister and one automation enroller', () => {
    const agentVisible = Object.values(beehiiv.actions()).filter((action) => action.audience !== 'human');
    expect(agentVisible).toHaveLength(25);
    expect(new Set(agentVisible.map((action) => action.name)).size).toBe(agentVisible.length);
    expect(new Set(agentVisible.map((action) => action.displayName)).size).toBe(agentVisible.length);
    expect(agentVisible.filter((action) => /^List Posts/.test(action.displayName)).map((action) => action.name)).toEqual(['list_posts']);
    expect(agentVisible.filter((action) => /^List Automations/.test(action.displayName)).map((action) => action.name)).toEqual(['list_automations']);
    expect(agentVisible.filter((action) => /^Add Subscription to Automation/.test(action.displayName)).map((action) => action.name)).toEqual(['add_subscription_to_automation']);
  });
});

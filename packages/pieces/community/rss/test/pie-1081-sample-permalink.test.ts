import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rssNewItemTrigger } from '../src/lib/triggers/new-item-trigger';
import { rssNewItemListTrigger } from '../src/lib/triggers/new-item-list-triggers';
import { fakeFeeds, RouteFeedServer } from './helpers/fake-feeds';

let server: RouteFeedServer;

beforeAll(async () => {
  server = await fakeFeeds.startRouteServer();
  server.set('/feed.xml', {
    body: fakeFeeds.rssDocument({
      title: 'opaque-guids',
      items: [{ guid: 'post-1', title: 'Post 1', pubDate: new Date('2026-10-20T08:00:00Z') }],
    }),
  });
});
afterAll(async () => {
  await server.stop();
});

function schemaKeys({ trigger }: { trigger: { outputSchema?: unknown } }): string[] {
  const fields = fieldOf({ value: trigger.outputSchema, key: 'fields' });
  if (!Array.isArray(fields)) {
    return [];
  }
  return fields.flatMap((field: unknown) => {
    const key = fieldOf({ value: field, key: 'key' });
    return typeof key === 'string' ? [key] : [];
  });
}

function fieldOf({ value, key }: { value: unknown; key: string }): unknown {
  return typeof value === 'object' && value !== null ? Reflect.get(value, key) : undefined;
}

describe('PIE-1081: sample data shows permalink', () => {
  it('a real item from a feed with isPermaLink="false" guids has no permalink', async () => {
    const trigger = fakeFeeds.asPolling(rssNewItemTrigger);
    const [item] = await trigger.test(
      fakeFeeds.triggerContext({ trigger, propsValue: { rss_feed_url: server.url('/feed.xml') }, store: fakeFeeds.memoryStore() }),
    );
    expect(item).toBeDefined();
    expect(item).not.toHaveProperty('permalink');
  });

  it.each([
    ['New Item', rssNewItemTrigger],
    ['New Items in Multiple Feeds', rssNewItemListTrigger],
  ])('%s: sampleData does not advertise permalink unless the output schema documents it', (_name, trigger) => {
    const inSample = Object.prototype.hasOwnProperty.call(trigger.sampleData, 'permalink');
    const inSchema = schemaKeys({ trigger }).includes('permalink');
    expect(inSample && !inSchema).toBe(false);
  });
});

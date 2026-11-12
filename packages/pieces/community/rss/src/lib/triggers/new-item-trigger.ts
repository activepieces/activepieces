import { PieceAuth, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { rssFeedUrl } from '../common/props';
import { rssFeedPoller } from '../common/feed-poller';
import { sampleData } from '../common/sampleData';
import { newItemTriggerOutputSchema } from '../output-schemas';

export const rssNewItemTrigger = createTrigger({
  name: 'new-item',
  classification: 'READ',
  displayName: 'New Item in Feed',
  description: 'Runs when a new item is published in an RSS feed.',
  aiMetadata: {
    description:
      'Fires when a new entry is published in a single monitored RSS/Atom feed. Polls the configured feed URL and emits each newly detected item (deduplicated by item id and publish date), representing a freshly published article, post, or update from that feed.',
  },
  type: TriggerStrategy.POLLING,
  sampleData: sampleData,
  auth: PieceAuth.None(),
  props: {
    rss_feed_url: rssFeedUrl,
  },
  outputSchema: newItemTriggerOutputSchema,
  async test(context): Promise<unknown[]> {
    return rssFeedPoller.sample({ urls: [context.propsValue.rss_feed_url] });
  },
  async onEnable(context): Promise<void> {
    await rssFeedPoller.enable({
      store: context.store,
      urls: [context.propsValue.rss_feed_url],
      isRepublish: context.isRepublish === true,
    });
  },
  async onDisable(): Promise<void> {
  },
  async run(context): Promise<unknown[]> {
    return rssFeedPoller.poll({ store: context.store, urls: [context.propsValue.rss_feed_url] });
  },
});

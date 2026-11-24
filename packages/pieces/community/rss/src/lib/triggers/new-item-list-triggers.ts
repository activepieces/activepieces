import { PieceAuth, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { rssFeedUrls } from '../common/props';
import { rssFeedPoller } from '../common/feed-poller';
import { sampleData } from '../common/sampleData';
import { newItemListTriggerOutputSchema } from '../output-schemas';

export const rssNewItemListTrigger = createTrigger({
  name: 'new-item-list',
  classification: 'READ',
  displayName: 'New Items in Multiple Feeds',
  description: 'Runs when a new item is published in any of the feeds you list.',
  aiMetadata: {
    description:
      'Fires when a new entry is published in any one of several monitored RSS/Atom feeds. Polls every configured feed URL in parallel and tracks each feed separately, emitting each newly detected item once (deduplicated by item id and publish date, including an article that appears in more than one feed). A feed that fails to load is skipped and checked again on the next poll without re-sending its old items; the poll only fails when every feed fails.',
  },
  type: TriggerStrategy.POLLING,
  sampleData: sampleData,
  auth: PieceAuth.None(),
  props: {
    rss_feed_urls: rssFeedUrls,
  },
  outputSchema: newItemListTriggerOutputSchema,
  async test(context): Promise<unknown[]> {
    return rssFeedPoller.sample({ urls: context.propsValue.rss_feed_urls });
  },
  async onEnable(context): Promise<void> {
    await rssFeedPoller.enable({
      store: context.store,
      urls: context.propsValue.rss_feed_urls,
      isRepublish: context.isRepublish === true,
    });
  },
  async onDisable(): Promise<void> {
  },
  async run(context): Promise<unknown[]> {
    return rssFeedPoller.poll({ store: context.store, urls: context.propsValue.rss_feed_urls });
  },
});

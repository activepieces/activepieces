import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  Property,
  StaticPropsValue,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { mastodonPolling } from '../common/polling';
import { mastodonSampleData } from '../common/sample-data';
import { statusOutputSchema } from '../output-schemas';

const props = {
  hashtag: Property.ShortText({
    displayName: 'Hashtag',
    description: 'The hashtag to watch, without the # sign, for example opensource.',
    required: true,
  }),
  local: Property.Checkbox({
    displayName: 'Only Local Statuses',
    description: 'Only trigger for posts by accounts on your own server.',
    required: false,
    defaultValue: false,
  }),
  only_media: Property.Checkbox({
    displayName: 'Only Statuses With Media',
    description: 'Only trigger for posts that have images, video or audio attached.',
    required: false,
    defaultValue: false,
  }),
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof mastodonAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    const hashtag = propsValue.hashtag.trim().replace(/^#/, '');
    if (hashtag === '') {
      throw new Error('Enter a hashtag to watch, for example opensource.');
    }
    return mastodonPolling.fetchNewItems({
      auth: auth.props,
      path: `/api/v1/timelines/tag/${encodeURIComponent(hashtag)}`,
      query: {
        local: propsValue.local === true ? true : undefined,
        only_media: propsValue.only_media === true ? true : undefined,
      },
      lastItemId,
      operation: 'New Status with Hashtag',
      scope: 'read:statuses',
    });
  },
};

export const newStatusWithHashtag = createTrigger({
  auth: mastodonAuth,
  name: 'new_status_with_hashtag',
  classification: 'READ',
  displayName: 'New Status with Hashtag',
  description:
    'Triggers when a new public post uses a hashtag. Posts from other servers are included once they reach your server.',
  aiMetadata: {
    description:
      'Fires once per new public status using the watched hashtag, as seen by the connected server, optionally limited to local posts or posts with media; the payload is the full status.',
  },
  props,
  sampleData: mastodonSampleData.status,
  outputSchema: statusOutputSchema,
  type: TriggerStrategy.POLLING,
  async test(context) {
    return pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
  },
});

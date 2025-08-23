import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

const WEBHOOK_DATA_STORE_KEY = 'mailchimp_new_segment_tag_webhook';

type WebhookData = { id: string; listId: string };

export const mailChimpNewSegmentTagSubscriberTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'new-segment-tag-subscriber',
  displayName: 'New Segment Tag Subscriber',
  description: 'Fires when a subscriber joins a specific segment or tag.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,

    segment_id: Property.ShortText({
      displayName: 'Segment ID (optional)',
      required: false,
    }),
    tag_name: Property.ShortText({
      displayName: 'Tag Name (optional)',
      required: false,
    }),
  },

  sampleData: {
    type: 'profile',
    fired_at: '2025-01-01 12:00:00',
    data: {
      list_id: 'abcd1234',
      email: 'user@example.com',
    },
  },

  async onEnable(context) {
    const token = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(token);

    const webhookId = await mailchimpCommon.enableWebhookRequest({
      server,
      token,
      listId: context.propsValue.list_id!,
      webhookUrl: context.webhookUrl!,
      events: { profile: true },
    });

    await context.store?.put<WebhookData>(WEBHOOK_DATA_STORE_KEY, {
      id: webhookId,
      listId: context.propsValue.list_id!,
    });
  },

  async onDisable(context) {
    const token = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(token);
    const data = await context.store?.get<WebhookData>(WEBHOOK_DATA_STORE_KEY);
    if (!data) return;

    await mailchimpCommon.disableWebhookRequest({
      server,
      token,
      listId: data.listId,
      webhookId: data.id,
    });
  },

  async run(context) {
    const body = context.payload.body as any;
    if (!body || body.type !== 'profile') return [];

    const wantedSegment = context.propsValue.segment_id?.trim();
    const wantedTag = context.propsValue.tag_name?.trim()?.toLowerCase();

    const tags: string[] =
      (body?.data?.tags as string[]) ??
      (body?.data?.merges?.TAGS as string)
        ?.split(',')
        .map((s: string) => s.trim()) ??
      [];

    if (wantedTag && !tags.map((t) => t.toLowerCase()).includes(wantedTag)) {
      return [];
    }

    return [body];
  },
});

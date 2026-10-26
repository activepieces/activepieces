import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { discourseAuth } from '../auth';
import { discourseMap } from '../common/mappers';
import { discourseOps } from '../common/operations';
import { discourseSchemas } from '../common/schemas';
import { discourseWebhook, WEBHOOK_INSTRUCTIONS } from '../common/webhook';

export const newPostTrigger = createTrigger({
  auth: discourseAuth,
  name: 'new_post',
  classification: 'READ',
  displayName: 'New Post',
  description: 'Triggers when a new post or reply is created.',
  aiMetadata: {
    description:
      'Fires once for each new post on the Discourse forum, including replies in private messages unless excluded; the first post of a new topic is skipped unless enabled. Needs a global admin API key.',
  },
  props: {
    instructions: Property.MarkDown({ value: WEBHOOK_INSTRUCTIONS }),
    include_first_post: Property.Checkbox({
      displayName: 'Include First Posts of New Topics',
      required: false,
      defaultValue: false,
    }),
    include_private_messages: Property.Checkbox({
      displayName: 'Include Private Messages',
      required: false,
      defaultValue: false,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 501,
    topic_id: 42,
    post_number: 2,
    username: 'alice',
    name: 'Alice',
    user_id: 7,
    raw: 'Thanks for the welcome!',
    cooked: '<p>Thanks for the welcome!</p>',
    topic_slug: 'welcome-to-the-forum',
    topic_title: 'Welcome to the forum',
    url: 'https://forum.example.com/t/welcome-to-the-forum/42/2',
    reply_to_post_number: null,
    reply_count: 0,
    like_count: 0,
    version: 1,
    hidden: false,
    created_at: '2026-10-13T08:05:00.000Z',
    updated_at: '2026-10-13T08:05:00.000Z',
    deleted_at: null,
    event: 'post_created',
    event_id: '102',
  },
  outputSchema: discourseSchemas.webhookPost,
  async onEnable(context) {
    await discourseWebhook.enable({ auth: context.auth.props, webhookUrl: context.webhookUrl, store: context.store, events: ['post_created'] });
  },
  async onDisable(context) {
    await discourseWebhook.disable({ auth: context.auth.props, store: context.store });
  },
  async run(context) {
    const delivery = await discourseWebhook.receive({
      payload: context.payload,
      store: context.store,
      events: ['post_created'],
      nowMs: Date.now(),
    });
    if (delivery === undefined) {
      return [];
    }
    const record = discourseMap.rec(delivery.body['post']);
    if (context.propsValue.include_first_post !== true && discourseMap.num(record['post_number']) === 1) {
      return [];
    }
    if (context.propsValue.include_private_messages !== true && record['topic_archetype'] === 'private_message') {
      return [];
    }
    return [
      {
        ...discourseMap.post({ raw: record, baseUrl: discourseOps.baseUrl(context.auth.props) }),
        event: delivery.event,
        event_id: delivery.eventId,
      },
    ];
  },
});

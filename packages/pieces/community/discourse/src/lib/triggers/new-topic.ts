import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { discourseAuth } from '../auth';
import { discourseMap } from '../common/mappers';
import { discourseOps } from '../common/operations';
import { discourseSchemas } from '../common/schemas';
import { discourseWebhook, WEBHOOK_INSTRUCTIONS } from '../common/webhook';

export const newTopicTrigger = createTrigger({
  auth: discourseAuth,
  name: 'new_topic',
  classification: 'READ',
  displayName: 'New Topic',
  description: 'Triggers when a new topic is created.',
  aiMetadata: {
    description:
      'Fires once for each new topic created on the Discourse forum (private messages only when enabled), with the topic details. Needs a global admin API key.',
  },
  props: {
    instructions: Property.MarkDown({ value: WEBHOOK_INSTRUCTIONS }),
    include_private_messages: Property.Checkbox({
      displayName: 'Include Private Messages',
      description: 'Also trigger for new private message conversations.',
      required: false,
      defaultValue: false,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 42,
    title: 'Welcome to the forum',
    slug: 'welcome-to-the-forum',
    url: 'https://forum.example.com/t/welcome-to-the-forum/42',
    category_id: 4,
    tags: 'announcements',
    posts_count: 1,
    reply_count: 0,
    views: 1,
    like_count: 0,
    excerpt: null,
    created_at: '2026-10-13T08:00:00.000Z',
    last_posted_at: '2026-10-13T08:00:00.000Z',
    bumped_at: '2026-10-13T08:00:00.000Z',
    closed: false,
    archived: false,
    pinned: false,
    visible: true,
    archetype: 'regular',
    last_poster_username: 'alice',
    user_id: 7,
    event: 'topic_created',
    event_id: '101',
  },
  outputSchema: discourseSchemas.webhookTopic,
  async onEnable(context) {
    await discourseWebhook.enable({ auth: context.auth.props, webhookUrl: context.webhookUrl, store: context.store, events: ['topic_created'] });
  },
  async onDisable(context) {
    await discourseWebhook.disable({ auth: context.auth.props, store: context.store });
  },
  async run(context) {
    const delivery = await discourseWebhook.receive({
      payload: context.payload,
      store: context.store,
      events: ['topic_created'],
      nowMs: Date.now(),
    });
    if (delivery === undefined) {
      return [];
    }
    const record = discourseMap.rec(delivery.body['topic']);
    if (context.propsValue.include_private_messages !== true && record['archetype'] === 'private_message') {
      return [];
    }
    return [
      {
        ...discourseMap.topicSummary({ raw: record, baseUrl: discourseOps.baseUrl(context.auth.props) }),
        user_id: discourseMap.num(record['user_id']),
        event: delivery.event,
        event_id: delivery.eventId,
      },
    ];
  },
});

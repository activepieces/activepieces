import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { discourseAuth } from '../auth';
import { discourseMap } from '../common/mappers';
import { discourseOps } from '../common/operations';
import { discourseSchemas } from '../common/schemas';
import { discourseWebhook, WEBHOOK_INSTRUCTIONS } from '../common/webhook';

export const postEditedTrigger = createTrigger({
  auth: discourseAuth,
  name: 'post_edited',
  classification: 'READ',
  displayName: 'Post Edited',
  description: 'Triggers when a post is edited.',
  aiMetadata: {
    description:
      'Fires once for each edit of a post on the Discourse forum (private messages excluded unless enabled), with the post after the edit. Needs a global admin API key.',
  },
  props: {
    instructions: Property.MarkDown({ value: WEBHOOK_INSTRUCTIONS }),
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
    event: 'post_edited',
    event_id: '103',
  },
  outputSchema: discourseSchemas.webhookPost,
  async onEnable(context) {
    await discourseWebhook.enable({ auth: context.auth.props, webhookUrl: context.webhookUrl, store: context.store, events: ['post_edited'] });
  },
  async onDisable(context) {
    await discourseWebhook.disable({ auth: context.auth.props, store: context.store });
  },
  async run(context) {
    const delivery = await discourseWebhook.receive({
      payload: context.payload,
      store: context.store,
      events: ['post_edited'],
      nowMs: Date.now(),
    });
    if (delivery === undefined) {
      return [];
    }
    const record = discourseMap.rec(delivery.body['post']);
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

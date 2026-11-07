import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { discourseAuth } from '../auth';
import { discourseMap } from '../common/mappers';
import { discourseOps } from '../common/operations';
import { discourseSchemas } from '../common/schemas';
import { discourseWebhook, WEBHOOK_INSTRUCTIONS } from '../common/webhook';

export const newUserTrigger = createTrigger({
  auth: discourseAuth,
  name: 'new_user',
  classification: 'READ',
  displayName: 'New User',
  description: 'Triggers when a user account is created.',
  aiMetadata: {
    description: 'Fires once for each new user account created on the Discourse forum, with the public profile. Needs a global admin API key.',
  },
  props: {
    instructions: Property.MarkDown({ value: WEBHOOK_INSTRUCTIONS }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 7,
    username: 'alice',
    name: 'Alice',
    title: null,
    avatar_url: 'https://forum.example.com/letter_avatar_proxy/v4/letter/a/8edcca/240.png',
    trust_level: 0,
    admin: false,
    moderator: false,
    active: false,
    staged: false,
    suspended_till: null,
    silenced_till: null,
    created_at: '2026-10-13T08:00:00.000Z',
    last_seen_at: null,
    last_posted_at: null,
    post_count: 0,
    badge_count: 0,
    location: null,
    website: null,
    bio_raw: null,
    event: 'user_created',
    event_id: '104',
  },
  outputSchema: discourseSchemas.webhookUser,
  async onEnable(context) {
    await discourseWebhook.enable({ auth: context.auth.props, webhookUrl: context.webhookUrl, store: context.store, events: ['user_created'] });
  },
  async onDisable(context) {
    await discourseWebhook.disable({ auth: context.auth.props, store: context.store });
  },
  async run(context) {
    const delivery = await discourseWebhook.receive({
      payload: context.payload,
      store: context.store,
      events: ['user_created'],
      nowMs: Date.now(),
    });
    if (delivery === undefined) {
      return [];
    }
    return [
      {
        ...discourseMap.user({ raw: delivery.body['user'], baseUrl: discourseOps.baseUrl(context.auth.props) }),
        event: delivery.event,
        event_id: delivery.eventId,
      },
    ];
  },
});

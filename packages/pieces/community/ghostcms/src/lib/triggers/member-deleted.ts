import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';

import { ghostAuth } from '../auth';
import { ghostWebhook } from '../common/webhooks';
import { ghostMemberDeletedTriggerOutputSchema } from '../output-schemas';

export const memberDeleted = createTrigger({
  auth: ghostAuth,
  name: 'member_deleted',
  outputSchema: ghostMemberDeletedTriggerOutputSchema,
  classification: 'READ',
  displayName: 'Member Deleted',
  description: 'Triggers when a member is deleted',
  aiMetadata: {
    description: 'Fires when a member is removed from the Ghost publication (member.deleted). Payload carries the deleted member record under the previous values.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    await ghostWebhook.enable({
      auth: context.auth,
      event: 'member.deleted',
      webhookUrl: context.webhookUrl,
      store: context.store,
      storeKey: '_member_deleted_trigger',
    });
  },
  async onDisable(context) {
    await ghostWebhook.disable({ auth: context.auth, store: context.store, storeKey: '_member_deleted_trigger' });
  },
  async run(context) {
    await ghostWebhook.assertSigned({
      store: context.store,
      storeKey: '_member_deleted_trigger',
      rawBody: context.payload.rawBody,
      headers: context.payload.headers,
    });
    return [context.payload.body];
  },

  sampleData: {
    member: {
      current: {},
      previous: {
        id: '64be7cd524cb9a0001f49f04',
        name: 'Updated Name',
        note: null,
        uuid: 'b6ef6f63-5bb0-4ace-8abf-f9f7c152659c',
        email: 'my@email.com',
        tiers: [],
        comped: false,
        labels: [],
        status: 'free',
        created_at: '2023-07-24T13:29:57.000Z',
        subscribed: true,
        updated_at: '2023-07-24T13:43:00.000Z',
        email_count: 0,
        geolocation: null,
        newsletters: [
          {
            id: '64be4f5a03946b00098ef8f6',
            name: 'Test Publication',
            slug: 'default-newsletter',
            uuid: '8bc1b063-57fa-4f26-8d7c-46a3d8002fad',
            status: 'active',
            created_at: '2023-07-24T10:15:54.000Z',
            show_badge: true,
            sort_order: 0,
            updated_at: '2023-07-24T10:16:18.000Z',
            visibility: 'members',
            description: null,
            sender_name: null,
            title_color: null,
            border_color: null,
            header_image: null,
            sender_email: null,
            footer_content: null,
            sender_reply_to: 'newsletter',
            title_alignment: 'center',
            background_color: 'light',
            feedback_enabled: false,
            show_comment_cta: true,
            show_header_icon: true,
            show_header_name: false,
            show_header_title: true,
            show_latest_posts: false,
            body_font_category: 'sans_serif',
            show_feature_image: true,
            subscribe_on_signup: true,
            title_font_category: 'sans_serif',
            show_post_title_section: true,
            show_subscription_details: false,
          },
        ],
        avatar_image:
          'https://www.gravatar.com/avatar/123123123?s=250&r=g&d=blank',
        last_seen_at: null,
        subscriptions: [],
        email_open_rate: null,
        email_opened_count: 0,
      },
    },
  },
});

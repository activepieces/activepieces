import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';

import { ghostAuth } from '../..';
import { common } from '../common';

export const memberDeleted = createTrigger({
  auth: ghostAuth,
  name: 'member_deleted',
  displayName: 'Member Deleted',
  description: 'Triggers when a member is deleted',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const webhookData: any = await common.subscribeWebhook(
      context.auth,
      'member.deleted',
      context.webhookUrl
    );

    await context.store?.put('_member_deleted_trigger', {
      webhookId: webhookData.webhooks[0].id,
    });
  },
  async onDisable(context) {
    const response: {
      webhookId: string;
    } | null = await context.store?.get('_member_deleted_trigger');

    if (response !== null && response !== undefined) {
      await common.unsubscribeWebhook(context.auth, response.webhookId);
    }
  },
  async run(context) {
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

import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';

import { boxAuth } from '../auth';
import { boxApi } from '../common/api';
import type { BoxWebhook, BoxWebhookTarget } from '../common/types';

export const newCommentTrigger = createTrigger({
  auth: boxAuth,
  name: 'new_comment',
  classification: 'READ',
  displayName: 'New Comment',
  description: 'Triggers when a comment is created',
  aiMetadata: {
    description:
      'Fires when a user posts a new comment on the specified Box file or folder. Each event represents a single created comment, including the comment text, the item it was added to, and the author.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    id: Property.ShortText({
      displayName: 'File/Folder ID',
      description: 'The ID of the item to trigger a webhook',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Item Type',
      description: 'The type of the item to trigger a webhook',
      required: true,
      options: {
        options: [
          { label: 'File', value: 'file' },
          { label: 'Folder', value: 'folder' },
        ],
      },
    }),
  },

  async onEnable(context) {
    const target: BoxWebhookTarget = {
      id: context.propsValue.id,
      type: context.propsValue.type,
    };

    const webhook = await boxApi.createWebhook({
      auth: context.auth,
      event: 'COMMENT.CREATED',
      target: target,
      webhookUrl: context.webhookUrl,
    });
    await context.store.put(`_new_comment_trigger`, webhook);
  },

  async onDisable(context) {
    const webhook = await context.store.get<BoxWebhook>(
      `_new_comment_trigger`
    );

    if (webhook) {
      await boxApi.deleteWebhook({ auth: context.auth, webhookId: webhook.id });
    }
  },

  async run(context) {
    return [context.payload.body];
  },

  sampleData: {
    type: 'webhook_event',
    id: '9a30442d-f681-4d25-8815-aa46f0515387',
    created_at: '2023-04-19T13:25:07-07:00',
    trigger: 'COMMENT.CREATED',
    webhook: { id: '1396363668', type: 'webhook' },
    created_by: {
      type: 'user',
      id: '24316851337',
      name: 'Bonobo',
      login: 'email@gmail.com',
    },
    source: {
      id: '538146815',
      type: 'comment',
      is_reply_comment: false,
      message: 'Simple times...',
      created_by: {
        type: 'user',
        id: '24316851337',
        name: 'Bonobo',
        login: 'email@gmail.com',
      },
      created_at: '2023-04-19T13:25:07-07:00',
      item: { id: '1194590019402', type: 'file' },
      modified_at: '2023-04-19T13:25:07-07:00',
    },
    additional_info: [],
  },
});

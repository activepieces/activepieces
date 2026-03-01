import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';

import { boxAuth } from '../..';
import { WebhookInformation, common } from '../common';

export const newFolder = createTrigger({
  auth: boxAuth,
  name: 'new_folder',
  displayName: 'New Folder',
  description: 'Triggers when a folder is created',
  type: TriggerStrategy.WEBHOOK,
  props: {
    folder: Property.ShortText({
      displayName: 'Folder ID',
      description:
        'The ID of the folder in which file uploads will trigger this webhook',
      required: true,
    }),
  },

  async onEnable(context) {
    const target: any = {
      id: context.propsValue.folder,
      type: 'folder',
    };

    const webhook = await common.subscribeWebhook(context.auth, {
      event: 'FOLDER.CREATED',
      target: target,
      webhookUrl: context.webhookUrl,
    });
    await context.store.put(`_new_folder_trigger`, webhook);
  },

  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(
      `_new_folder_trigger`
    );

    if (webhook) {
      await common.unsubscribeWebhook(context.auth, webhook.id);
    }
  },

  async run(context) {
    return [context.payload.body];
  },

  sampleData: {
    id: '3f08aca1-aa0b-49a5-8e5a-5d8980bfbdef',
    type: 'webhook_event',
    source: {
      id: '218634717358',
      etag: '0',
      name: 'test folder',
      size: 0,
      type: 'folder',
      parent: {
        id: '218635125044',
        etag: '0',
        name: 'Desktop',
        type: 'folder',
        sequence_id: '0',
      },
      purged_at: null,
      created_at: '2023-07-25T05:55:08-07:00',
      trashed_at: null,
      description: '',
      item_status: 'active',
      modified_at: '2023-07-25T05:55:08-07:00',
      sequence_id: '0',
      shared_link: null,
      path_collection: {
        entries: [
          {
            id: '0',
            etag: null,
            name: 'All Files',
            type: 'folder',
            sequence_id: null,
          },
          {
            id: '218635125044',
            etag: '0',
            name: 'Desktop',
            type: 'folder',
            sequence_id: '0',
          },
        ],
        total_count: 2,
      },
      content_created_at: '2023-07-25T05:55:08-07:00',
      content_modified_at: '2023-07-25T05:55:08-07:00',
      folder_upload_email: null,
    },
    trigger: 'FOLDER.CREATED',
    webhook: {
      id: '1738566186',
      type: 'webhook',
    },
    created_at: '2023-07-25T05:55:09-07:00',
    additional_info: [],
  },
});

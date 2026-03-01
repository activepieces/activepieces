import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';

import { boxAuth } from '../..';
import { WebhookInformation, common } from '../common';

export const newFile = createTrigger({
  auth: boxAuth,
  name: 'new_file',
  displayName: 'New File',
  description: 'Triggers when a file is uploaded',
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
      event: 'FILE.UPLOADED',
      target: target,
      webhookUrl: context.webhookUrl,
    });
    await context.store.put(`_new_file_trigger`, webhook);
  },

  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(
      `_new_file_trigger`
    );

    if (webhook) {
      await common.unsubscribeWebhook(context.auth, webhook.id);
    }
  },

  async run(context) {
    return [context.payload.body];
  },

  sampleData: {
    type: 'webhook_event',
    id: 'fb0bd323-33b9-4f71-9dbc-fbcc3fe109ad',
    created_at: '2023-04-19T12:06:52-07:00',
    trigger: 'FILE.UPLOADED',
    webhook: { id: '1396340122', type: 'webhook' },
    created_by: {
      type: 'user',
      id: '24316851337',
      name: 'Bonobo',
      login: 'email@gmail.com',
    },
    source: {
      id: '1194585432265',
      type: 'file',
      file_version: {
        type: 'file_version',
        id: '1302595111465',
        sha1: '63da452d845b91ccb638510d046b902e96275359',
      },
      sequence_id: '0',
      etag: '0',
      sha1: '63da452d845b91ccb638510d046b902e96275359',
      name: 'ap-logo.svg',
      description: '',
      size: 877,
      path_collection: { total_count: 2, entries: [Array] },
      created_at: '2023-04-19T12:06:52-07:00',
      modified_at: '2023-04-19T12:06:52-07:00',
      trashed_at: null,
      purged_at: null,
      content_created_at: '2023-02-02T06:54:17-08:00',
      content_modified_at: '2023-02-02T06:54:17-08:00',
      created_by: {
        type: 'user',
        id: '24316851337',
        name: 'Bonobo',
        login: 'email@gmail.com',
      },
      modified_by: {
        type: 'user',
        id: '24316851332',
        name: 'Bonobo',
        login: 'email@gmail.com',
      },
      owned_by: {
        type: 'user',
        id: '24316851332',
        name: 'Bonobo',
        login: 'email@gmail.com',
      },
      shared_link: null,
      parent: {
        type: 'folder',
        id: '198605434359',
        sequence_id: '0',
        etag: '0',
        name: 'Kinembe',
      },
      item_status: 'active',
    },
    additional_info: [],
  },
});

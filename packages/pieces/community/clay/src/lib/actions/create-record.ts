import { createAction, Property } from '@activepieces/pieces-framework';

import { clayAuth } from '../auth';
import { sendRecordToWebhook } from '../common/client';

export const clayCreateRecordAction = createAction({
  auth: clayAuth,
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Create a new record in a Clay table by posting record data to the table webhook URL.',
  props: {
    webhookUrl: Property.ShortText({
      displayName: 'Table Webhook URL',
      description:
        'The Clay table webhook URL. Format: https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-{UUID}',
      required: true,
    }),
    recordData: Property.Object({
      displayName: 'Record Data',
      description: 'Key-value pairs to send to Clay. Keys should match your Clay table column names.',
      required: true,
    }),
  },
  async run(context) {
    const { webhookUrl, recordData } = context.propsValue;

    return await sendRecordToWebhook({
      webhookUrl,
      recordData: recordData as Record<string, unknown>,
    });
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';

import { clayAuth } from '../auth';
import { sendRecordToWebhook } from '../common/client';

export const clayUpdateRecordAction = createAction({
  auth: clayAuth,
  name: 'update_record',
  displayName: 'Update Record',
  description:
    'Update or upsert a Clay record by posting record data to the table webhook URL. Clay auto-dedupe handles matching when the unique identifier field is included.',
  props: {
    webhookUrl: Property.ShortText({
      displayName: 'Table Webhook URL',
      description:
        'The Clay table webhook URL. Format: https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-{UUID}',
      required: true,
    }),
    uniqueIdentifierField: Property.ShortText({
      displayName: 'Unique Identifier Field',
      description:
        'The field name Clay uses for auto-dedupe, such as Email, LinkedIn URL, or Company Domain.',
      required: true,
    }),
    recordData: Property.Object({
      displayName: 'Record Data',
      description: 'Key-value pairs to send to Clay. This object must include the unique identifier field.',
      required: true,
    }),
  },
  async run(context) {
    const { webhookUrl, uniqueIdentifierField, recordData } = context.propsValue;
    const data = recordData as Record<string, unknown>;

    if (!Object.prototype.hasOwnProperty.call(data, uniqueIdentifierField)) {
      throw new Error(
        `Record data must include the unique identifier field "${uniqueIdentifierField}".`
      );
    }

    return await sendRecordToWebhook({
      webhookUrl,
      recordData: data,
    });
  },
});

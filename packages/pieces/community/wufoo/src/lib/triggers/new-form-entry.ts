import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { wufooAuth } from '../../index';
import { wufooApiCall } from '../common/client';

const TRIGGER_KEY = 'wufoo-webhook-hash';

export const newFormEntryTrigger = createTrigger({
  auth: wufooAuth,
  name: 'new_form_entry',
  displayName: 'New Form Entry',
  description: 'Triggers when a new form entry is submitted.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  
  async onEnable(context) {
    const { formIdentifier, handshakeKey, includeMetadata } = context.propsValue as {
      formIdentifier: string;
      handshakeKey?: string;
      includeMetadata?: boolean;
    };
    const { apiKey, subdomain } = context.auth;

    const response = await wufooApiCall<{
      WebHookPutResult: { Hash: string };
    }>({
      method: HttpMethod.PUT,
      auth: { apiKey, subdomain },
      resourceUri: `/forms/${formIdentifier}/webhooks.json`,
      body: {
        url: context.webhookUrl,
        handshakeKey: handshakeKey || undefined,
        metadata: includeMetadata ? 'true' : 'false',
      },
    });

    await context.store.put<string>(TRIGGER_KEY, response.WebHookPutResult.Hash);
  },

  async onDisable(context) {
    const webhookHash = await context.store.get<string>(TRIGGER_KEY);
    const { formIdentifier } = context.propsValue as { formIdentifier: string };
    const { apiKey, subdomain } = context.auth;

    if (!isNil(webhookHash)) {
      await wufooApiCall({
        method: HttpMethod.DELETE,
        auth: { apiKey, subdomain },
        resourceUri: `/forms/${formIdentifier}/webhooks/${webhookHash}.json`,
      });
    }
  },

  async run(context) {
    return [context.payload.body];
  },

  async test(context) {
    return [
      {
        EntryId: '123',
        Field1: 'John Doe',
        Field218: 'john@example.com',
        DateCreated: '2025-07-08 10:00:00',
      },
    ];
  },

  sampleData: {
    EntryId: '123',
    Field1: 'Jane Doe',
    Field2: 'Welcome!',
    Field218: 'jane@example.com',
    DateCreated: '2025-07-08 09:00:00',
  },
});

import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { wufooAuth } from '../../index';
import { wufooApiCall } from '../common/client';
import { Property } from '@activepieces/pieces-framework';
import { formIdentifier } from '../common/props';

const TRIGGER_KEY = 'wufoo-webhook-hash';

export const newFormEntryTrigger = createTrigger({
  auth: wufooAuth,
  name: 'new-form-entry',
  displayName: 'New Form Entry',
  description: 'Triggers when a new form submission is received.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    subdomain: Property.ShortText({
      displayName: 'Wufoo Subdomain',
      description: 'Your Wufoo account subdomain (e.g., `fishbowl` in `https://fishbowl.wufoo.com`).',
      required: true,
    }),
    formIdentifier: formIdentifier,
    handshakeKey: Property.ShortText({
      displayName: 'Handshake Key',
      description: 'Optional key used to verify incoming webhooks.',
      required: false,
    }),
    includeMetadata: Property.Checkbox({
      displayName: 'Include Metadata',
      description: 'Include form/field structure data in webhook payload.',
      required: false,
      defaultValue: true,
    }),
  },
  async onEnable(context) {
    const { subdomain, formIdentifier, handshakeKey, includeMetadata } = context.propsValue;

    const response = await wufooApiCall<{
      WebHookPutResult: { Hash: string };
    }>({
      method: HttpMethod.PUT,
      auth: context.auth,
      resourceUri: `https://${subdomain}.wufoo.com/api/v3/forms/${formIdentifier}/webhooks.json`,
      body: {
        url: context.webhookUrl,
        handshakeKey: handshakeKey || undefined,
        metadata: includeMetadata ? 'true' : 'false',
      },
    });

    await context.store.put<string>(TRIGGER_KEY, response.WebHookPutResult.Hash);
  },
  async onDisable(context) {
    const { subdomain, formIdentifier } = context.propsValue;
    const webhookHash = await context.store.get<string>(TRIGGER_KEY);

    if (!isNil(webhookHash)) {
      await wufooApiCall({
        method: HttpMethod.DELETE,
        auth: context.auth,
        resourceUri: `https://${subdomain}.wufoo.com/api/v3/forms/${formIdentifier}/webhooks/${webhookHash}.json`,
      });
    }
  },
  async test(context) {
    return [
      {
        EntryId: '123',
        Field1: 'Test Name',
        Field218: 'test@example.com',
        DateCreated: '2025-07-07 12:00:00',
      },
    ];
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    EntryId: '123',
    Field1: 'Jane Doe',
    Field2: 'Hello from Wufoo',
    Field218: 'jane@doe.com',
    DateCreated: '2025-07-07 10:00:00',
  },
});

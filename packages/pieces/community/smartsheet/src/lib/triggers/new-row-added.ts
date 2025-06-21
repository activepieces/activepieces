import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { smartsheetApiCall } from '../common/client';
import { sheetDropdown } from '../common/props';
import { smartsheetAuth } from '../../index';

const TRIGGER_KEY = 'new-row-webhook-id';

export const newRowAddedTrigger = createTrigger({
  auth: smartsheetAuth,
  name: 'new-row-added',
  displayName: 'New Row Added',
  description: 'Triggers when a new row is added to the selected sheet.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    sheetId: sheetDropdown(true),
  },

  async onEnable(context) {
    const { sheetId } = context.propsValue;
    const { apiKey, region } = context.auth as { apiKey: string; region: string };

    const webhookResponse = await smartsheetApiCall<{ result: { id: string } }>({
      apiKey,
      region: region as 'default' | 'gov' | 'eu' | 'au' | undefined,
      method: HttpMethod.POST,
      resourceUri: '/webhooks',
      body: {
        name: 'New Row Webhook',
        callbackUrl: context.webhookUrl,
        scope: 'sheet',
        scopeObjectId: sheetId,
        events: ['*.*'],
        version: 1,
        enabled: true,
      },
    });

    await context.store.put<string>(TRIGGER_KEY, webhookResponse.result.id);
  },

  async onDisable(context) {
    const { apiKey, region } = context.auth as { apiKey: string; region: string };
    const webhookId = await context.store.get<string>(TRIGGER_KEY);

    if (!isNil(webhookId)) {
      await smartsheetApiCall({
        apiKey,
        region: region as 'default' | 'gov' | 'eu' | 'au' | undefined,
        method: HttpMethod.DELETE,
        resourceUri: `/webhooks/${webhookId}`,
      });
    }
  },

  async test(context) {
    const { apiKey, region } = context.auth as { apiKey: string; region: string };
    const { sheetId } = context.propsValue;

    const response = await smartsheetApiCall<{ rows: unknown[] }>({
      apiKey,
      region: region as 'default' | 'gov' | 'eu' | 'au' | undefined,
      method: HttpMethod.GET,
      resourceUri: `/sheets/${sheetId}`,
    });

    return response.rows.slice(-5);
  },

  async run(context) {
    return [context.payload.body];
  },

  sampleData: {
    events: [
      {
        eventId: 'sampleEventId',
        sheetId: 1234567890,
        rowId: 987654321,
        eventType: 'ROW_ADDED',
        userId: 111222333,
      },
    ],
  },
});

import { ConnectApi } from 'docusign-esign';

import { docusignAuth } from './auth';
import { createApiClient } from './common';
import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

type StoredConfig = { connectId: string };

export function createEnvelopeEventTrigger({
  name,
  displayName,
  description,
  docusignEvent,
  sampleData,
}: {
  name: string;
  displayName: string;
  description: string;
  docusignEvent: string;
  sampleData: Record<string, unknown>;
}) {
  return createTrigger({
    auth: docusignAuth,
    name,
    displayName,
    description,
    type: TriggerStrategy.WEBHOOK,
    props: {
      accountId: Property.ShortText({
        displayName: 'Account ID',
        required: true,
      }),
    },
    sampleData,
    async onEnable(context) {
      const apiClient = await createApiClient(context.auth);
      const connectApi = new ConnectApi(apiClient);

      const result = await connectApi.createConfiguration(
        context.propsValue.accountId,
        {
          connectCustomConfiguration: {
            name: `Activepieces - ${displayName}`,
            urlToPublishTo: context.webhookUrl,
            events: [docusignEvent],
            allowEnvelopePublish: 'true',
            configurationType: 'custom',
            deliveryMode: 'SIM',
            eventData: {
              version: 'restv2.1',
            },
            enableLog: 'true',
          },
        }
      );

      await context.store.put<StoredConfig>(`_docusign_${name}`, {
        connectId: result.connectId as string,
      });
    },
    async onDisable(context) {
      const stored = await context.store.get<StoredConfig>(`_docusign_${name}`);
      if (!stored?.connectId) return;

      const apiClient = await createApiClient(context.auth);
      const connectApi = new ConnectApi(apiClient);

      await connectApi.deleteConfiguration(
        context.propsValue.accountId,
        stored.connectId
      );
    },
    async run(context) {
      return [context.payload.body];
    },
  });
}

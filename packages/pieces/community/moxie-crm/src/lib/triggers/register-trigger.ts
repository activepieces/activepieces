import {
  AiMetadata,
  OutputSchema,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieWebhook } from '../common/webhook';
import { moxieCRMTriggerOutputSchemas } from '../output-schemas';

export const moxieCRMRegisterTrigger = ({
  name,
  displayName,
  description,
  aiMetadata,
  eventType,
  sampleData,
  autoRegister,
}: {
  name: string;
  displayName: string;
  description: string;
  aiMetadata?: AiMetadata;
  eventType: string;
  sampleData: unknown;
  autoRegister?: boolean;
}) => {
  const outputSchema: OutputSchema | undefined = moxieCRMTriggerOutputSchemas[name];
  if (autoRegister === true) {
    return createTrigger({
      auth: moxieCRMAuth,
      name: `moxie_trigger_${name}`,
      classification: 'READ',
      displayName,
      description,
      aiMetadata,
      props: {
        md: Property.MarkDown({
          value: `This trigger registers its webhook in Moxie automatically when the flow is published, and removes it when the flow is turned off. There is nothing to set up in Moxie.`,
        }),
      },
      outputSchema,
      type: TriggerStrategy.WEBHOOK,
      sampleData,
      async onEnable(context) {
        await moxieWebhook.enable({
          credentials: credentialsOf({ auth: context.auth }),
          store: context.store,
          type: eventType,
          hookUrl: context.webhookUrl,
        });
      },
      async onDisable(context) {
        await moxieWebhook.disable({
          credentials: credentialsOf({ auth: context.auth }),
          store: context.store,
        });
      },
      async run(context) {
        return moxieWebhook.acceptDelivery({ eventType, payload: context.payload });
      },
    });
  }
  return createTrigger({
    auth: moxieCRMAuth,
    name: `moxie_trigger_${name}`,
    classification: 'READ',
    displayName,
    description,
    aiMetadata,
    props: {
      md: Property.MarkDown({
        value: `
        - In Moxie, go to **Workspace Settings > Connected Apps > Integrations**.
        - Under **Custom Integration**, click **Add Rest Hook**.
        - In the endpoint field, paste the following URL:
            \`\`\`text
            {{webhookUrl}}
            \`\`\`

        - Select the event **\`${displayName}\`** and click **Save**.

        Deliveries for any other event type are ignored, and a delivery repeated within 15 minutes runs the flow only once.
        `,
      }),
    },
    outputSchema,
    type: TriggerStrategy.WEBHOOK,
    sampleData,
    async onEnable() {
      return;
    },
    async onDisable() {
      return;
    },
    async run(context) {
      return moxieWebhook.acceptDelivery({ eventType, payload: context.payload });
    },
  });
};

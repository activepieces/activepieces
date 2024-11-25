import {
  TriggerStrategy,
  createTrigger,
  Property,
} from '@activepieces/pieces-framework';
import { MoxieCRMEventType } from '.';
import { moxieCRMAuth } from '../../';
export const moxieCRMRegisterTrigger = ({
  name,
  displayName,
  description,
  eventType,
  sampleData,
}: {
  name: string;
  displayName: string;
  description: string;
  eventType: MoxieCRMEventType;
  sampleData: unknown;
}) =>
  createTrigger({
    auth: moxieCRMAuth,
    name: `moxie_trigger_${name}`,
    displayName,
    description,
    props: {
      md: Property.MarkDown({
        value: `
        - Go to the **Workspace Settngs -> Connected Apps -> Integration** section.
        - Under **Custom Integration** , click on **Add Rest Hook**.
        - Click on **Integrations** section.
        - In the endpoint field, paste the following URL: 
            \`\`\`text
            {{webhookUrl}}
            \`\`\`

        - Select the event as **\`${displayName}\`** and click on **Save**.
        `,
      }),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: sampleData,
    async onEnable(context) {
      // Empty
    },
    async onDisable(context) {
      // Empty
    },
    async run(context) {
      return [context.payload.body];
    },
  });

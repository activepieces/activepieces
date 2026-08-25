import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { moveoAuth } from '../auth';

export const dialogExpired = createTrigger({
  name: 'dialog_expired',
  displayName: 'Dialog Expired',
  description: 'Triggers when the dialog expires.',
  aiMetadata: {
    description: 'Fires when a Moveo conversation (dialog) expires due to inactivity or reaching its session timeout. The event payload represents the expired dialog, including its identifiers and session context, signaling that the conversation has ended without explicit closure.',
  },
  auth: moveoAuth,
  props: {
    setupInstructions: Property.MarkDown({
      value: `
**Quick Setup:**

1. In Moveo: **Deploy → Developer Tools → Event notifications**
2. Click **Create event**
3. Select the event **Dialog expired**
4. **URL:** \`{{webhookUrl}}\`
5. (Optional) Set a **Secret** and keep it saved for webhook verification
6. Click **Create**
      `,
    }),
  },
  sampleData: null,
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    return;
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const body = (context.payload.body);
    const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
    return [parsedBody];
  },
});

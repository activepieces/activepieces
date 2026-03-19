import { formsiteAuth } from '../..';
import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

export const newFormResult = createTrigger({
  auth: formsiteAuth,
  name: 'newFormResult',
  displayName: 'New Form Result',
  description: 'Trigger when a new form result is submitted',
  props: {
    instruction: Property.MarkDown({
      value: `
  **Enable Basic Authentication:**
  1. Login to your Formbricks account
  2. Open the form you want to connect
  3. Change tab to *From Settings* -> *Integrations* -> *Server Post*
  4. Enable *Server Post* and set the URL to the webhook URL generated after you save the trigger.
  \`\`\`text
			{{webhookUrl}}
			\`\`\`
5. Select Message format as *JSON*
6. Save the settings
`,
    }),
  },
  sampleData: {
    user_ip: '::1',
    date_start: '2025-12-15T12:59:48.416Z',
    user_referrer: 'N/A',
    user_os: 'Windows (deprecated)',
    result_status: 'Complete',
    date_finish: '2025-12-15T12:59:51.695Z',
    date_update: '2025-12-15T12:59:51.701Z',
    user_browser: 'Chrome',
    id: '19086671',
    items: [
      {
        id: '0',
        position: 0,
        value: 'dasas',
      },
      {
        values: [
          {
            position: 0,
            value: 'Choice A',
          },
        ],
        id: '1',
        position: 1,
      },
    ],
    user_device: 'Desktop',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // implement webhook creation logic
  },
  async onDisable(context) {
    // implement webhook deletion logic
  },
  async run(context) {
    return [context.payload.body];
  },
});

import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { logrocketAuth } from '../common/auth';

export const highlightsReady = createTrigger({
  auth: logrocketAuth,
  name: 'highlightsReady',
  displayName: 'Highlights Ready',
  description: 'Trigger when session highlights are ready. Use this webhook URL when requesting highlights.',
  props: {
    markdown: Property.MarkDown({
      value: `
## Webhook Configuration

This trigger receives highlights results from LogRocket when they're ready.

**To use this trigger:**

1. Copy the webhook URL below
2. Use it as the **Webhook URL** field when using the "Request Highlights" action
3. When highlights are ready, this trigger will fire with the results

**Webhook URL:**
\`\`\`text
{{webhookUrl}}
\`\`\`
      `,
    }),
  },
  sampleData: {
    result: {
      highlights: 'The user [checks out their cart](https://app.logrocket.com/orgID/appID/s/5-14de95d6-d5b8-1a62-0a3a-4858caf874b0/0?t=1715564734801) and [encounters an error loading settings](https://app.logrocket.com/orgID/appID/s/5-3cde95d6-a5b8-4a62-9b3a-6aa834f8747c/0?t=1715564554783).',
      sessions: [
        {
          recordingID: '5-3cde95d6-a5b8-4a62-9b3a-6aa834f8747c',
          sessionID: 0,
          highlights: 'The user [encounters an error loading settings](https://app.logrocket.com/orgID/appID/s/5-3cde95d6-a5b8-4a62-9b3a-6aa834f8747c/0?t=1715564554783) and [the issue persists](https://app.logrocket.com/orgID/appID/s/5-3cde95d6-a5b8-4a62-9b3a-6aa834f8747c/0?t=1715564734801).',
        },
        {
          recordingID: '5-14de95d6-d5b8-1a62-0a3a-4858caf874b0',
          sessionID: 0,
          highlights: 'The user [adds an item to their cart](https://app.logrocket.com/orgID/appID/s/5-14de95d6-d5b8-1a62-0a3a-4858caf874b0/0?t=1715564554783) and [proceeds to checkout](https://app.logrocket.com/orgID/appID/s/5-14de95d6-d5b8-1a62-0a3a-4858caf874b0/0?t=1715564734801)',
        },
      ],
    },
    status: 'READY',
    appID: 'orgID/appID',
    requestID: '0cc12cad4b5b8b93760edf7fb5731ac66fbc8a766f9431df6c1e72b214ed6a65',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // No need to register webhook - LogRocket will POST to this URL when highlights are ready
  },
  async onDisable(context) {
    // No need to unregister webhook
  },
  async run(context) {
    return [context.payload.body];
  },
});


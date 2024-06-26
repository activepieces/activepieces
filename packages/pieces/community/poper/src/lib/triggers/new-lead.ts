
import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';

const message = `**Live Webhook:**
\`\`\`text
{{webhookUrl}}
\`\`\`
<br>
Use this webhook to trigger a flow when a new lead is obtained from a popup.

**Test Webhook:**
\`\`\`text
{{webhookUrl}}/test
\`\`\`
<br>
Use this webhook to test this trigger.
`;

export const newLead = createTrigger({
auth: undefined,
name: 'newLead',
displayName: 'New Lead',
description: 'Triggers when a new lead is obtained from popup',
props: {
  markdown: Property.MarkDown({
    value: message,
  }),
},
sampleData: {},
type: TriggerStrategy.WEBHOOK,
async onEnable() {
  // ignore
},
async onDisable() {
  // ignore
},
async run(context) {
  return [context.payload.body];
},
});

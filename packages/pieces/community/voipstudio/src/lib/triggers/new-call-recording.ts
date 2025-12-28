import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { voipstudioAuth } from '../common/auth';

export const newCallRecording = createTrigger({
  auth: voipstudioAuth,
  name: 'newCallRecording',
  displayName: 'New Call Recording',
  description:
    'Triggers when a new call recording is ready for a completed call.',
  props: {
    instruction: Property.MarkDown({
      value: `
            1. Login to https://voipstudio.com/
            2. Click on **Integrations**
            3. Scroll down to **Webhooks** and Enable
            4. Select **Add Webhook** to create a new one
            5. Enter any name for the new Webhook to identify
            6. Select events to listen for. Select **Call Recording** event
            7. Enter the following URL in the webhook configuration
    \`\`\`text
            {{webhookUrl}}
            \`\`\`
  
                  `,
    }),
  },
  sampleData: {
    id: 'uk003.608920d55f7ac3.77053295',
    event_time: '2021-04-28 08:46:13',
    event_name: 'monitor.audio_ready',
    monitor_id: 123456,
    call_id: 139543232,
    customer_id: 100,
    user_id: 50,
    src_id: '0',
    src: '447854740947',
    src_name: 'Test Caller',
    dst_id: '10002',
    dst: '441183211001',
    dst_name: 'John Smith',
    context: 'LOCAL_USER',
    duration: 45,
    size: 2048000,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    //
    // Register the webhook with VoIPStudio
  },

  async onDisable(context) {
    // Clean up the stored webhook URL
  },

  async run(context) {
    const payload = context.payload.body as any;

    // Return the webhook payload as a single item
    return [payload];
  },
});

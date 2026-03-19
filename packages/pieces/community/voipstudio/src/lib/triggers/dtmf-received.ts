import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

export const dtmfReceived = createTrigger({
  name: 'dtmfReceived',
  displayName: 'DTMF Received',
  description:
    'Triggered when a DTMF (Dual-Tone Multi-Frequency) tone is received during a call',
  props: {
    instruction: Property.MarkDown({
      value: `
        1. Login to https://voipstudio.com/
        2. Click on **Integrations**
        3. Scroll down to **Webhooks** and Enable
        4. Select **Add Webhook** to create a new one
        5. Enter any name for the new Webhook to identify
        6. Select events to listen for. Select **DTMF Received** event
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
    event_name: 'call.dtmf',
    call_id: 139543232,
    state: 'DTMF_RECEIVED',
    connected_at: '2021-04-28 08:46:02',
    start_time: '2021-04-28 08:45:55',
    context: 'LOCAL_USER',
    destination: 'in',
    duration: 11,
    src: '447854740947',
    src_id: '0',
    src_name: '"442035141598" <2035141598>',
    src_hash: 'fe5935cefbc82fc4e924bdaa21342a49c18c5dd9',
    dst: '441183211001',
    dst_id: '10002',
    dst_name: 'John Smith',
    dtmf_tag: '*',
    dtmf_target: 'U:123456',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // VoIPStudio webhooks are configured manually in the admin panel
    // This trigger will receive POST requests when DTMF is received
  },
  async onDisable(context) {
    // VoIPStudio webhooks are disabled manually in the admin panel
  },
  async run(context) {
    return [context.payload.body];
  },
});

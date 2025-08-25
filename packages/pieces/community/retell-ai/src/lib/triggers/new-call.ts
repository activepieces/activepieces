import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import Retell from 'retell-sdk';
import { retellAiAuth } from '../common';

export const newCall = createTrigger({
  auth: retellAiAuth,
  name: 'newCall',
  displayName: 'New Call',
  description:
    'Fires when a new outgoing or incoming call is created in Retell AI. Provides call status and metadata.',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    event: 'call_started',
    call: {
      call_type: 'phone_call',
      from_number: '+12137771234',
      to_number: '+12137771235',
      direction: 'inbound',
      call_id: 'Jabr9TXYYJHfvl6Syypi88rdAHYHmcq6',
      agent_id: 'oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD',
      call_status: 'registered',
      metadata: {},
      retell_llm_dynamic_variables: {
        customer_name: 'John Doe',
      },
      start_timestamp: 1714608475945,
      end_timestamp: 1714608491736,
      disconnection_reason: 'user_hangup',
      transcript: '...',
      transcript_object: [[Object], [Object], [Object], [Object]],
      transcript_with_tool_calls: [[Object], [Object], [Object], [Object]],
      opt_out_sensitive_data_storage: false,
    },
  },
  async onEnable(context) {
    // The webhook is created manually by the user on the dashboard
  },
  async onDisable(context) {
    // The webhook is deleted manually by the user on the dashboard
  },
  async run(context) {
    if (
      !Retell.verify(
        JSON.stringify(context.payload.body),
        context.payload.headers['x-retell-signature'] as string,
        context.auth
      )
    ) {
      throw new Error('Invalid signature');
    }

    const body = context.payload.body as { event?: string };

    if (body.event === 'call_started') {
      return [body];
    }
    return [];
  },
});

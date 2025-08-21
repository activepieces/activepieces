import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { retellAiAuth, retellAiApi } from '../common';

export const newCall = createTrigger({
  auth: retellAiAuth,
  name: 'new_call',
  displayName: 'New Call',
  description: 'Fires when a new outgoing or incoming call is created in Retell AI',
  type: TriggerStrategy.POLLING,
  props: {
    limit: {
      displayName: 'Limit',
      description: 'Maximum number of calls to retrieve per poll',
      required: false,
      defaultValue: 10,
    },
  },
  async run(context) {
    const limit = context.propsValue.limit || 10;
    
    try {
      const response = await retellAiApi.post('/v2/list-calls', context.auth, {
        limit,
        offset: 0,
      });
      
      if (response.calls && Array.isArray(response.calls)) {
        return response.calls.map(call => ({
          call_id: call.call_id,
          call_type: call.call_type,
          from_number: call.from_number,
          to_number: call.to_number,
          direction: call.direction,
          agent_id: call.agent_id,
          call_status: call.call_status,
          start_timestamp: call.start_timestamp,
          metadata: call.metadata || {},
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch calls:', error);
      return [];
    }
  },

  sampleData: {
    call_id: 'Jabr9TXYYJHfvl6Syypi88rdAHYHmcq6',
    call_type: 'phone_call',
    from_number: '+12137771234',
    to_number: '+12137771235',
    direction: 'outbound',
    agent_id: 'oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD',
    call_status: 'registered',
    start_timestamp: 1703302407333,
    metadata: {},
  },
});

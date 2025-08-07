import { 
  createTrigger, 
  TriggerStrategy,
  Property
} from '@activepieces/pieces-framework';
import { openphoneAuth } from '../common/auth';
import { Call } from '../common/common';

export const outgoingCallCompletedTrigger = createTrigger({
  auth: openphoneAuth,
  name: 'outgoing_call_completed',
  displayName: 'Outgoing Call Completed',
  description: 'Fires when an outbound call ends. Useful for call logging.',
  props: {
    phoneNumberId: Property.ShortText({
      displayName: 'Phone Number ID',
      description: 'Filter by specific phone number ID (optional)',
      required: false,
    }),
  },
  sampleData: {
    id: 'call_123456',
    direction: 'outbound',
    phoneNumberId: 'pn_123456',
    from: '+15559876543',
    to: '+15551234567',
    status: 'completed',
    duration: 180,
    createdAt: '2024-01-15T10:30:00Z',
    completedAt: '2024-01-15T10:33:00Z'
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    const phoneNumberId = context.propsValue.phoneNumberId;
    
    const webhookData = {
      url: webhookUrl,
      events: ['call.completed'],
      ...(phoneNumberId && { phoneNumberId })
    };
    
    console.log('Registering webhook:', webhookData);
  },
  async onDisable(context) {
    console.log('Unregistering webhook');
  },
  async run(context) {
    const body = context.payload.body as any;
    
    if (body.event === 'call.completed' && body.data.direction === 'outbound') {
      return [body.data as Call];
    }
    
    return [];
  },
});
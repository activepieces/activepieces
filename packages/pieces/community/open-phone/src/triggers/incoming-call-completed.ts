import { 
  createTrigger, 
  TriggerStrategy,
  Property
} from '@activepieces/pieces-framework';
import { openphoneAuth } from '../common/auth';
import { Call } from '../common/common';

export const incomingCallCompletedTrigger = createTrigger({
  auth: openphoneAuth,
  name: 'incoming_call_completed',
  displayName: 'Incoming Call Completed',
  description: 'Fires when an incoming call is completed. Includes voicemail data if available.',
  props: {
    phoneNumberId: Property.ShortText({
      displayName: 'Phone Number ID',
      description: 'Filter by specific phone number ID (optional)',
      required: false,
    }),
  },
  sampleData: {
    id: 'call_123456',
    direction: 'inbound',
    phoneNumberId: 'pn_123456',
    from: '+15551234567',
    to: '+15559876543',
    status: 'completed',
    duration: 90,
    voicemailUrl: 'https://voicemails.openphone.com/vm_123456.mp3',
    createdAt: '2024-01-15T10:30:00Z',
    completedAt: '2024-01-15T10:31:30Z'
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
    
    if (body.event === 'call.completed' && body.data.direction === 'inbound') {
      return [body.data as Call];
    }
    
    return [];
  },
});
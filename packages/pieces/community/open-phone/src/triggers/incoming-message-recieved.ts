import { 
  createTrigger, 
  TriggerStrategy,
  Property
} from '@activepieces/pieces-framework';
import { openphoneAuth } from '../common/auth';
import { Message } from '../common/common';

export const incomingMessageReceivedTrigger = createTrigger({
  auth: openphoneAuth,
  name: 'incoming_message_received',
  displayName: 'Incoming Message Received',
  description: 'Fires when a new SMS/MMS message is received.',
  props: {
    phoneNumberId: Property.ShortText({
      displayName: 'Phone Number ID',
      description: 'Filter by specific phone number ID (optional)',
      required: false,
    }),
  },
  sampleData: {
    id: 'msg_123456',
    direction: 'inbound',
    phoneNumberId: 'pn_123456',
    from: '+15551234567',
    to: '+15559876543',
    body: 'Hello, I have a question about your services',
    mediaUrls: ['https://media.openphone.com/img_123456.jpg'],
    status: 'delivered',
    createdAt: '2024-01-15T10:30:00Z'
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    const phoneNumberId = context.propsValue.phoneNumberId;
    
    const webhookData = {
      url: webhookUrl,
      events: ['message.received'],
      ...(phoneNumberId && { phoneNumberId })
    };
    
    console.log('Registering webhook:', webhookData);
  },
  async onDisable(context) {
    console.log('Unregistering webhook');
  },
  async run(context) {
    const body = context.payload.body as any;
    
    if (body.event === 'message.received' && body.data.direction === 'inbound') {
      return [body.data as Message];
    }
    
    return [];
  },
});
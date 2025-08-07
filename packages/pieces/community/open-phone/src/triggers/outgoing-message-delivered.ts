import { 
  createTrigger, 
  TriggerStrategy,
  Property
} from '@activepieces/pieces-framework';
import { openphoneAuth } from '../common/auth';
import { Message } from '../common/common';

export const outgoingMessageDeliveredTrigger = createTrigger({
  auth: openphoneAuth,
  name: 'outgoing_message_delivered',
  displayName: 'Outgoing Message Delivered',
  description: 'Fires when an outbound message is delivered successfully. Useful for message confirmation workflows.',
  props: {
    phoneNumberId: Property.ShortText({
      displayName: 'Phone Number ID',
      description: 'Filter by specific phone number ID (optional)',
      required: false,
    }),
  },
  sampleData: {
    id: 'msg_123456',
    direction: 'outbound',
    phoneNumberId: 'pn_123456',
    from: '+15559876543',
    to: '+15551234567',
    body: 'Hello, this is a test message',
    status: 'delivered',
    createdAt: '2024-01-15T10:30:00Z'
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    const phoneNumberId = context.propsValue.phoneNumberId;
    
    const webhookData = {
      url: webhookUrl,
      events: ['message.delivered'],
      ...(phoneNumberId && { phoneNumberId })
    };
    
    console.log('Registering webhook:', webhookData);
  },
  async onDisable(context) {
    console.log('Unregistering webhook');
  },
  async run(context) {
    const body = context.payload.body as any;
    
    if (body.event === 'message.delivered' && body.data.direction === 'outbound') {
      return [body.data as Message];
    }
    
    return [];
  },
});

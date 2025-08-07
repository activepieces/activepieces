import { 
  createTrigger, 
  TriggerStrategy, 
  WebhookResponse,
  Property
} from '@activepieces/pieces-framework';
import { openphoneAuth } from '../common/auth';
import { Call } from '../common/common';

export const callRecordingCompletedTrigger = createTrigger({
  auth: openphoneAuth,
  name: 'call_recording_completed',
  displayName: 'Call Recording Completed',
  description: 'Fires when a call recording finishes. Useful for post-transcription or archival workflows.',
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
    phoneNumberId: 'phone_123456',
    from: '+1234567890',
    to: '+01987654321',
    status: 'completed',
    duration: 120,
    recordingUrl: 'https://recordings.openphone.com/call_123456.mp3',
    transcriptionId: 'trans_123456',
    createdAt: '2024-01-15T10:30:00Z',
    completedAt: '2024-01-15T10:32:00Z'
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    const phoneNumberId = context.propsValue.phoneNumberId;
    
    const webhookData = {
      url: webhookUrl,
      events: ['call.recording.completed'],
      ...(phoneNumberId && { phoneNumberId })
    };
    console.log('Registering webhook:', webhookData);
  },
  async onDisable(context) {
    console.log('Unregistering webhook');
  },
  async run(context) {
    const body = context.payload.body as any;
    
    if (body.event === 'call.recording.completed') {
      return [body.data as Call];
    }
    
    return [];
  },
});
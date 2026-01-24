import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { bolnaaiAuth } from '../common/auth';
export const callCompletionReport = createTrigger({
  auth: bolnaaiAuth,
  name: 'callCompletionReport',
  displayName: 'Call Completion Report',
  description: 'Triggers when  Bolna call report  it is completed',
  props: {
    markdown: Property.MarkDown({
      value: `## Bolna AI Webhook Setup
                To use this trigger, you need to manually set up a webhook in your Bolna AI account:
    
                1. Login to your Bolna AI account.
                2. Navigate to **Agent Setup** tab on the left navigation menu.
                3. Go to **Analytics** .
                4. Add to the **Push all execution data to webhook**  and specify the following URL:
                \`\`\`text
                {{webhookUrl}}
                \`\`\`
                5. Click Save Agent.
                `,
    }),
  },
  sampleData: {
    id: '7e8391e5-dd-4d3b-ddd-dfe255c71848',
    agent_id: '5a12b25a-dddd-4e77-90a5-9b4fd4577e44',
    batch_id: null,
    created_at: '2025-11-19T08:48:27.193399',
    updated_at: '2025-11-19T08:49:25.219095',
    scheduled_at: '2025-11-19T08:48:27.193376',
    answered_by_voice_mail: null,
    conversation_duration: 24.2,
    total_cost: 3.54,
    transcript:
      'assistant: Hello from Bolna\nuser:  hello\nassistant:  Hello! Am I speaking with you? Is this a good time to talk? How can I assist you today?\n',
    usage_breakdown: {
      llmModel: { 'azure/gpt-4.1-mini': { input: 1397, output: 23 } },
      llmTokens: 0,
      synthesizer_model: 'eleven_turbo_v2_5',
      transcriber_model: 'nova-3',
      llm_usage_breakdown: {
        hangup: null,
        analytics: null,
        extraction: null,
        conversation: {
          input: 1397,
          model: 'azure/gpt-4.1-mini',
          output: 23,
          provider: 'azure',
          provider_connected: false,
        },
        summarization: null,
      },
      synthesizer_provider: 'elevenlabs',
      transcriber_duration: 0,
      transcriber_provider: 'deepgram',
      synthesizer_characters: 111,
      synthesizer_usage_breakdown: {
        provider_connected: false,
        welcome_message_cache: true,
        conversation_characters: 111,
        welcome_message_characters: 0,
      },
      transcriber_usage_breakdown: {
        provider_connected: false,
        transcriber_duration: 0,
      },
    },
    cost_breakdown: {
      llm: 0.06,
      network: 0.375,
      platform: 2.0,
      synthesizer: 1.11,
      transcriber: 0.0,
      llm_breakdown: {
        hangup: 0,
        analytics: 0,
        extraction: 0,
        conversation: 0.06,
        summarization: 0,
      },
      transfer_cost: 0.0,
      synthesizer_breakdown: { conversation: 1.11, welcome_message: 0 },
      transcriber_breakdown: { analytics: 0, conversation: 0.0 },
    },
    extracted_data: null,
    summary: null,
    error_message: null,
    status: 'completed',
    agent_extraction: null,
    workflow_retries: null,
    rescheduled_at: null,
    custom_extractions: null,
    campaign_id: null,
    smart_status: null,
    user_number: '+9199999999',
    agent_number: '+916565656565',
    telephony_data: {
      duration: '24',
      to_number: '+9199999999',
      from_number: '+916565656565',
      recording_url:
        'https://bolna-recordings-india.s3.ap-south-1.amazonaws.com/plivo/e3v16015b-vvvv12ef-42fd-898c-52cevvv62058v8cd.mp3',
      hosted_telephony: true,
      provider_call_id: 'e316c015b-12ef-4c2fd-c898c-52ce620ccc588cd',
      call_type: 'outbound',
      provider: 'plivo',
      hangup_by: 'Callee',
      hangup_reason: 'Call recipient hungup',
      hangup_provider_code: 4000,
    },
    transfer_call_data: null,
    context_details: {
      recipient_data: null,
      recipient_phone_number: '+9199999990',
    },
    batch_run_details: null,
    provider: 'plivo',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // implement webhook creation logic
  },
  async onDisable(context) {
    // implement webhook deletion logic
  },
  async run(context) {
    const payload = context.payload.body as any;

    if (payload.status != 'completed') {
      return [];
    }
    return [context.payload.body];
  },
});

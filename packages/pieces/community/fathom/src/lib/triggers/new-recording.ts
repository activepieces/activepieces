import { fathomAuth } from '../..';
import {
  createTrigger,
  TriggerStrategy,
  Property
} from '@activepieces/pieces-framework';
import { Fathom } from 'fathom-typescript';

interface WebhookInformation {
  webhookId: string;
}

export const newRecording = createTrigger({
  auth: fathomAuth,
  name: 'newRecording',
  displayName: 'New Recording',
  description:
    'Fires when a meeting is recorded (i.e. a new meeting recording is produced)',
  props: {
    include_transcript: Property.Checkbox({
      displayName: 'Include Transcript',
      description: 'Include the transcript in the webhook payload',
      required: false,
      defaultValue: false
    }),
    include_crm_matches: Property.Checkbox({
      displayName: 'Include CRM Matches',
      description: 'Include CRM matches in the webhook payload',
      required: false,
      defaultValue: false
    })
  },
  sampleData: {
    title: 'Quarterly Business Review',
    meeting_title: 'QBR 2025 Q1',
    recording_id: 123456789,
    url: 'https://fathom.video/xyz123',
    share_url: 'https://fathom.video/share/xyz123',
    created_at: '2025-03-01T17:01:30Z',
    scheduled_start_time: '2025-03-01T16:00:00Z',
    scheduled_end_time: '2025-03-01T17:00:00Z',
    recording_start_time: '2025-03-01T16:01:12Z',
    recording_end_time: '2025-03-01T17:00:55Z',
    calendar_invitees_domains_type: 'one_or_more_external',
    transcript_language: 'en'
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const fathom = new Fathom({
      security: { apiKeyAuth: context.auth }
    });

    const webhookParams: any = {
      destinationUrl: context.webhookUrl,
      includeTranscript: context.propsValue.include_transcript || false,
      includeCrmMatches: context.propsValue.include_crm_matches || false
    };

    const webhook = await fathom.createWebhook(webhookParams);

    if (webhook?.id) {
      await context.store?.put<WebhookInformation>('_new_recording_webhook', {
        webhookId: webhook.id
      });
    }
  },
  async onDisable(context) {
    const webhookInfo = await context.store.get<WebhookInformation>(
      '_new_recording_webhook'
    );

    if (webhookInfo?.webhookId) {
      const fathom = new Fathom({
        security: { apiKeyAuth: context.auth }
      });

      await fathom.deleteWebhook({ id: webhookInfo.webhookId });
    }
  },
  async test(context) {
    const fathom = new Fathom({
      security: { apiKeyAuth: context.auth }
    });

    const params: any = {
      includeTranscript: context.propsValue.include_transcript || false,
      includeCrmMatches: context.propsValue.include_crm_matches || false
    };

    const response = await fathom.listMeetings(params);
    const meetings = (response as any).items?.slice(0, 3) ?? [];
    return meetings;
  },
  async run(context) {
    return [context.payload.body];
  }
});

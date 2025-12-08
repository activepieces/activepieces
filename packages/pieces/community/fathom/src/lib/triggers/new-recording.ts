import { fathomAuth } from '../..';
import {
  createTrigger,
  TriggerStrategy,
  Property
} from '@activepieces/pieces-framework';
import { Fathom } from 'fathom-typescript';
import { CreateWebhookRequest } from 'fathom-typescript/dist/esm/sdk/models/operations';

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
    triggered_for: Property.MultiSelectDropdown({
      auth: fathomAuth,
      displayName: 'Trigger For',
      description: 'Select which types of recordings should trigger this webhook',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'My Recordings', value: 'my_recordings' },
            { label: 'Shared External Recordings', value: 'shared_external_recordings' },
            { label: 'My Shared With Team Recordings', value: 'my_shared_with_team_recordings' },
            { label: 'Shared Team Recordings', value: 'shared_team_recordings' }
          ]
        };
      },
      defaultValue: ['my_recordings']
    }),
    include_transcript: Property.Checkbox({
      displayName: 'Include Transcript',
      description: 'Include the transcript in the webhook payload',
      required: false,
      defaultValue: false
    }),
    include_summary: Property.Checkbox({
      displayName: 'Include Summary',
      description: 'Include the summary in the webhook payload',
      required: false,
      defaultValue: false
    }),
    include_action_items: Property.Checkbox({
      displayName: 'Include Action Items',
      description: 'Include the action items in the webhook payload',
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
      security: { apiKeyAuth: context.auth.secret_text }
    });

    const webhookParams: CreateWebhookRequest = {
      destinationUrl: context.webhookUrl,
      triggeredFor: context.propsValue.triggered_for as ('my_recordings' | 'shared_external_recordings' | 'my_shared_with_team_recordings' | 'shared_team_recordings')[],
      includeTranscript: context.propsValue.include_transcript || false,
      includeSummary: context.propsValue.include_summary || false,
      includeActionItems: context.propsValue.include_action_items || false,
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
        security: { apiKeyAuth: context.auth.secret_text }
      });

      await fathom.deleteWebhook({ id: webhookInfo.webhookId });
    }
  },
  async test(context) {
    const fathom = new Fathom({
      security: { apiKeyAuth: context.auth.secret_text }
    });

    const params = {
      includeTranscript: context.propsValue.include_transcript || false,
      includeSummary: context.propsValue.include_summary || false,
      includeActionItems: context.propsValue.include_action_items || false,
      includeCrmMatches: context.propsValue.include_crm_matches || false
    };

    const response = await fathom.listMeetings(params);
    const meetings = [];
    for await (const meetingResponse of response) {
      if (meetingResponse?.result?.items) {
        meetings.push(...meetingResponse.result.items.slice(0, 3));
        if (meetings.length >= 3) break;
      }
    }
    return meetings.slice(0, 3);
  },
  async run(context) {
    return [context.payload.body];
  }
});

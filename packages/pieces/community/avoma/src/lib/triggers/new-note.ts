import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { avomaAuth, avomaCommon } from '../common';

export const newNote = createTrigger({
  auth: avomaAuth,
  name: 'newNote',
  displayName: 'New Note',
  description:
    'Triggers when notes are successfully generated for meetings or calls.',
  props: {},
  sampleData: {
    action_items: [
      {
        action_item: 'Follow up with client on project timeline',
        company: 'Avoma',
        email: 'john.doe@avoma.com',
        name: 'John Doe',
      },
      {
        action_item: 'Review and provide feedback on proposal',
        company: 'Client Corp',
        email: 'jane.smith@client.com',
        name: 'Jane Smith',
      },
    ],
    ai_notes: '<h2>Participants</h2><ul><li><p>Avoma: John Doe</p></li></ul>',
    ai_notes_txt: 'Participants: Avoma: John Doe',
    attendees: [
      {
        email: 'user@example.com',
        name: 'string',
        response_status: 'string',
        uuid: '095be615-a8ad-4c33-8e9c-c7612fbf6c9f',
      },
    ],
    audio_ready: true,
    audio_url: 'http://example.com',
    created: '2019-08-24T14:15:22Z',
    duration: 0,
    end_at: '2019-08-24T14:15:22Z',
    event_type: 'AINOTE',
    insights: {
      filler_wpm: [
        {
          designation: 'string',
          filler_wpm: 0,
          speaker_id: 'string',
        },
      ],
      longest_monologue: {
        rep: {
          segments: [[0]],
          speaker_id: 'string',
        },
      },
      patience: [
        {
          designation: 'string',
          patience: 0,
          speaker_id: 'string',
        },
      ],
      sentiment: {
        sentiment: 0,
        sentiment_ranges: [
          {
            range: 'string',
            sentiment_value: 0,
          },
        ],
      },
      speaker_mapping: {
        email: 'user@example.com',
        id: 0,
        name: 'string',
      },
      talk_stats: {
        talk_percentage: 0,
        total_talk_time: 0,
      },
      wpm: [
        {
          designation: 'string',
          speaker_id: 'string',
          wpm: 0,
        },
      ],
    },
    is_call: true,
    is_internal: true,
    meeting_url:
      'https://app.avoma.com/meeting/aa380fc2-725d-4ef8-909c-c595c0e62bcd',
    modified: '2019-08-24T14:15:22Z',
    notes_ready: true,
    organizer_email: 'user@example.com',
    organizer_name: 'string',
    privacy: 'private',
    processing_status: 'string',
    purpose: {
      label: 'string',
      uuid: '095be615-a8ad-4c33-8e9c-c7612fbf6c9f',
    },
    recording_uuid: '3e256a03-2cdd-4fe9-823b-2b61bb25d916',
    start_at: '2019-08-24T14:15:22Z',
    state: 'string',
    subject: 'string',
    transcript_ready: true,
    transcription_uuid: '4753c6bf-25a6-45a1-8d86-0af7c8bde615',
    transcription_vtt_url: 'http://example.com',
    uuid: '095be615-a8ad-4c33-8e9c-c7612fbf6c9f',
    video_ready: true,
    video_url: 'http://example.com',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Webhook is registered with avoma's support
  },
  async onDisable(context) {
    // Webhook is registered with avoma's support
  },
  async run(context) {
    if (
      avomaCommon.isWebhookSignatureValid({
        apiKey: context.auth,
        body: context.payload.body,
        headers: context.payload.headers,
      })
    ) {
      return [context.payload.body];
    } else {
      return [];
    }
  },
});

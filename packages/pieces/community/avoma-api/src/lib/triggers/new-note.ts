import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

export const newNote = createTrigger({
  name: 'new_note',
  displayName: 'New Note',
  description:
    'Triggers when notes are successfully generated for meetings or calls',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    action_items: [
      {
        action_item: 'Follow up with client on project timeline',
        company: 'Avoma',
        email: 'john.doe@avoma.com',
        name: 'John Doe'
      }
    ],
    ai_notes: '<h2>Participants</h2><ul><li><p>Avoma: John Doe</p></li></ul>',
    ai_notes_txt: 'Participants: Avoma: John Doe',
    attendees: [
      {
        email: 'user@example.com',
        name: 'John Doe',
        response_status: 'accepted',
        uuid: '095be615-a8ad-4c33-8e9c-c7612fbf6c9f'
      }
    ],
    audio_ready: true,
    audio_url: 'http://example.com',
    created: '2019-08-24T14:15:22Z',
    duration: 3600,
    end_at: '2019-08-24T14:15:22Z',
    event_type: 'AINOTE',
    is_call: true,
    is_internal: false,
    meeting_url:
      'https://app.avoma.com/meeting/aa380fc2-725d-4ef8-909c-c595c0e62bcd',
    modified: '2019-08-24T14:15:22Z',
    notes_ready: true,
    organizer_email: 'user@example.com',
    organizer_name: 'John Doe',
    privacy: 'private',
    processing_status: 'completed',
    recording_uuid: '3e256a03-2cdd-4fe9-823b-2b61bb25d916',
    start_at: '2019-08-24T14:15:22Z',
    state: 'completed',
    subject: 'Weekly Team Meeting',
    transcript_ready: true,
    transcription_uuid: '4753c6bf-25a6-45a1-8d86-0af7c8bde615',
    transcription_vtt_url: 'http://example.com',
    uuid: '095be615-a8ad-4c33-8e9c-c7612fbf6c9f',
    video_ready: true,
    video_url: 'http://example.com'
  },
  async onEnable() {
    // Webhook URL is automatically generated and available at context.webhookUrl
    // Users need to configure this URL in their Avoma webhook settings
    return;
  },
  async onDisable() {
    // Cleanup if needed when trigger is disabled
    return;
  },
  async run(context) {
    const payload = context.payload;

    // Validate that this is a note generation event
    if (!payload?.body || (payload.body as any).event_type !== 'AINOTE') {
      return [];
    }

    // Return the webhook payload as a trigger event
    return [payload.body];
  }
});

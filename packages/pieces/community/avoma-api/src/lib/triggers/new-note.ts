import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';

export const newNote = createTrigger({
  name: 'new_note',
  displayName: 'New Note',
  description:
    'Triggers when notes are successfully generated for meetings or calls',
  type: TriggerStrategy.WEBHOOK,
  props: {
    setupInstructions: Property.MarkDown({
      value: `
## Setup Instructions

To use this trigger, you need to manually configure a webhook in your Avoma account:

### 1. Access Avoma Webhook Settings
- Log into your Avoma account
- Go to **Settings > Integrations > Webhooks**
- Click **"Add Webhook"** or **"Create New Webhook"**

### 2. Configure the Webhook
1. **Webhook URL**: Paste this URL:
\`\`\`text
{{webhookUrl}}
\`\`\`
2. **Event Type**: Select **"AI Notes Generated"** or **"Notes Ready"**
3. **HTTP Method**: Set to **POST**
4. **Content Type**: Set to **application/json**

### 3. Optional Filters
Configure filters if needed:
- **Meeting Types**: Choose specific meeting types (calls, video meetings, etc.)
- **User Filters**: Limit to specific users or teams
- **Meeting Duration**: Filter by meeting length

### 4. Test and Save
1. Click **"Test Webhook"** to verify the connection
2. Click **"Save"** to activate the webhook

---

**Note:** You need admin permissions in Avoma to configure webhooks.

**Use Cases:**
- Automatically process meeting notes in your CRM
- Send meeting summaries to team channels
- Extract action items for task management
- Archive meeting insights to knowledge bases
      `,
    }),
  },
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
  async onEnable(context) {
    // Manual setup - no programmatic registration needed
  },

  async onDisable(context) {
    // Manual setup - users manage webhooks in Avoma UI
  },

  async run(context) {
    return [context.payload.body];
  }
});

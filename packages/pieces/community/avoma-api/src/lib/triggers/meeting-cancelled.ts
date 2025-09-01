import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';

export const meetingCancelled = createTrigger({
  name: 'meeting_cancelled',
  displayName: 'Meeting Cancelled',
  description: 'Triggers when a meeting booked via the scheduling page is cancelled',
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
2. **Event Type**: Select **"Meeting Cancelled"** or **"Meeting Canceled"**
3. **HTTP Method**: Set to **POST**
4. **Content Type**: Set to **application/json**

### 3. Optional Filters
Configure filters if needed:
- **Scheduling Pages**: Limit to specific Avoma scheduling pages
- **Cancellation Reason**: Filter by specific cancellation reasons
- **Organizer**: Limit to specific organizers or teams
- **Time Before Meeting**: Filter by how far in advance cancellations occur

### 4. Test and Save
1. Click **"Test Webhook"** to verify the connection
2. Click **"Save"** to activate the webhook

---

**Note:** You need admin permissions in Avoma to configure webhooks.

**Use Cases:**
- Automatically update calendar systems when meetings are cancelled
- Send cancellation notifications to relevant team members
- Update CRM records with cancellation information
- Trigger follow-up workflows for rescheduling
- Track cancellation patterns for scheduling optimization
      `,
    }),
  },
  sampleData: {
    booker_email: 'client@example.com',
    cancel_reason: 'Schedule conflict - need to reschedule for next week',
    conference_link: 'https://zoom.us/j/123456789',
    created: '2019-08-24T14:15:22Z',
    event_end_time: '2019-08-24T15:15:22Z',
    event_start_time: '2019-08-24T14:15:22Z',
    event_type: 'MEETING_BOOKED_VIA_SCHEDULER_CANCELED',
    invitee_details: {
      email: 'client@example.com',
      locale: 'en-US',
      name: 'John Client',
      tz: 'America/New_York'
    },
    invitee_responses: [
      {
        question: 'What would you like to discuss?',
        response: 'Product demo and pricing discussion'
      },
      {
        question: 'Company size?',
        response: '50-100 employees'
      }
    ],
    meeting_uuid: '65fb768c-30b9-4a9a-999f-5dab85e66635',
    modified: '2019-08-24T16:30:22Z',
    organizer_email: 'sales@company.com',
    organizer_timezone: 'America/New_York',
    purpose: 'Sales Demo',
    scheduling_page_link: 'https://meet.avoma.com/sales-demo',
    subject: 'Product Demo - John Client (Cancelled)',
    uuid: '095be615-a8ad-4c33-8e9c-c7612fbf6c9f'
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
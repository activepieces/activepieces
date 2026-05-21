import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';

const setupInstructions = `
**Setup Instructions**

1. In iMeetify, open **Integrations > More > Webhook** and click **Config**.
2. Fill in the form:
   - **Webhook Name:** any label (e.g. \`Activepieces\`)
   - **URL:** \`{{webhookUrl}}\`
   - **Authentication Key:** click **Generate Key** to create one (kept inside iMeetify)
   - **Events:** select **Appointment Confirmation** and/or **Appointment Cancellation**
3. Click **Save**. iMeetify requires an HTTPS URL — the URL above is already secure.

This trigger will only fire when the incoming event matches the **Event Type** selected below.
`;

export const appointmentEvent = createTrigger({
  name: 'appointment_event',
  displayName: 'Appointment Event',
  description:
    'Fires when an appointment is confirmed or cancelled in iMeetify.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    instructions: Property.MarkDown({
      value: setupInstructions,
      variant: MarkdownVariant.BORDERLESS,
    }),
    eventType: Property.StaticDropdown({
      displayName: 'Event Type',
      description:
        'Choose which event to listen for. Other event types received on this URL will be ignored.',
      required: true,
      defaultValue: 'confirmation',
      options: {
        disabled: false,
        options: [
          { label: 'Appointment Confirmation', value: 'appointment_schedule' },
          { label: 'Appointment Cancellation', value: 'appointment_cancel' },
        ],
      },
    }),
  },
  sampleData: {
    id: 'et_6a0ed723239a9',
    occurred_at: '2026-05-21T09:57:55.145850Z',
    object: 'event',
    appointment: {
      id: 37777,
      access_code: 'BSLWT8sjafZKAOR54SsCdxs5Vkv5H6Ber0HaqKMR',
      StartTime: {
        date: '2026-05-22 10:30:00.000000',
        timezone_type: 3,
        timezone: 'Asia/Kolkata',
      },
      EndTime: {
        date: '2026-05-22 11:00:00.000000',
        timezone_type: 3,
        timezone: 'Asia/Kolkata',
      },
      Type: { type: 'In-Person' },
    },
    invitee: {
      id: 36338,
      StartTime: {
        date: '2026-05-22 10:30:00.000000',
        timezone_type: 3,
        timezone: 'Asia/Kolkata',
      },
      EndTime: {
        date: '2026-05-22 11:00:00.000000',
        timezone_type: 3,
        timezone: 'Asia/Kolkata',
      },
      Email: 'sanket@gmail.com',
      FirstName: 'Sanket',
      LastName: 'Nannaware',
      MobileNumber: null,
      OrganizationName: null,
      TermsConditions: 0,
      PromotionalMessages: 0,
      Guests: null,
      Remarks: null,
    },
    qustions: [],
    event_type: 'appointment_schedule',
  },
  async onEnable() {
    return;
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const payload = context.payload.body as any;
    if (payload.data.event_type !== context.propsValue.eventType) {
      return [];
    }
    return [payload.data];
  },
});

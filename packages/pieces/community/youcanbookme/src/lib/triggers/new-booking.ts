import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { youcanbookmeAuth } from '../common/auth';
export const newBooking = createTrigger({
  auth: youcanbookmeAuth,
  name: 'newBooking',
  displayName: 'New Booking',
  description: 'Trigger when a new booking is made',
  props: {
    webhook_setup: Property.MarkDown({
      value: `
## Setting up a Webhook

1. Select the booking page you want to add a webhook to and click **Edit Settings**
2. Select **Additional options** from the left menu
3. Click **Notifications** under the sub-menu
4. Click into the notification you wish to have the webhook fire (After new booking made, rescheduled, cancelled, reminder, after appointment ends, etc)
5. Click the **+** to add a new notification
6. Click **Webhook**
7. Enter the URL provided by Activepieces (copy from the input field below)
	\`\`\`text
			{{webhookUrl}}
			\`\`\`
8. Choose method:
   - **POST** 
9. Add payload (optional)
10. Click **Save changes**
            `,
    }),
  },
  sampleData: {
    startsAt: '2025-12-17',
    endsAt: '08:30',
    timeZone: 'UTC',
    firstName: 'sa',
    email: 'test@test.com',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // implement webhook creation logic
  },
  async onDisable(context) {
    // implement webhook deletion logic
  },
  async run(context) {
    return [context.payload.body];
  },
});

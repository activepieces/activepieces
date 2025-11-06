import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { missiveAuth } from '../common/auth';

export const newMessage = createTrigger({
  name: 'new_message',
  displayName: 'New Message',
  description: 'Triggers when new messages are received (email, SMS, WhatsApp, Facebook, etc.)',
  auth: missiveAuth,
  props: {
    setupInstructions: Property.MarkDown({
      value: `
## Setup Instructions

To use this trigger, you need to manually create a webhook rule in your Missive account:

### 1. Access Missive Rules
- Open Missive and go to **Settings > Rules**
- Click **"New incoming rule"** or **"New outgoing rule"**

### 2. Configure the Trigger
Choose from these message types:
- **Email** - Incoming email messages
- **SMS** - Text messages  
- **WhatsApp** - WhatsApp messages
- **Facebook Messenger** - Facebook messages
- **Instagram** - Instagram messages
- **Twitter** - Twitter messages
- **Missive Live Chat** - Live chat messages

### 3. Add Filters (Optional)
Configure filters like:
- Specific sender email addresses
- Subject line contains text
- Message content contains keywords
- Organization or team scope

### 4. Set Webhook Action
1. In the **Actions** section, select **"Webhook"**
2. Paste this URL in the **Webhook URL** field:
\`\`\`text
{{webhookUrl}}
\`\`\`
3. Set **HTTP Method** to **POST**
4. Leave **Content Type** as **application/json**

### 5. Save the Rule
- Click **Save** to activate the webhook
- Missive will validate your endpoint automatically

---

**Note:** You need admin/owner permissions and a Productive plan to create rules.

**Example Use Cases:**
- Trigger when emails from specific customers arrive
- Process all WhatsApp messages for customer support
- Route urgent emails (subject contains "URGENT") to special workflows
- Log all social media interactions to your CRM
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    rule: {
      id: "45408b30-aa3a-45n1-bh67-0a0cb8da9080",
      description: "New message webhook",
      type: "incoming_email"
    },
    conversation: {
      id: "47a57b76-df42-4d8k-927x-80dbe5d87191",
      subject: "Important customer inquiry",
      latest_message_subject: "Re: Important customer inquiry",
      organization: {
        id: "93e5e5d5-11a2-4c9b-80b8-94f3c08068cf",
        name: "Your Organization"
      },
      team: {
        id: "2f618f9e-d3d4-4a01-b7d5-57124ab366b8",
        name: "Support Team",
        organization: "93e5e5d5-11a2-4c9b-80b8-94f3c08068cf"
      },
      assignees: [
        {
          id: "6b52b6b9-9b51-46ad-a4e3-82ef3c45512c",
          name: "John Doe",
          email: "john@company.com"
        }
      ],
      shared_labels: [
        {
          id: "146ff5c4-d5la-3b63-b994-76711fn790lq",
          name: "Customer Support"
        }
      ],
      web_url: "https://mail.missiveapp.com/#inbox/conversations/47a57b76-df42-4d8k-927x-80dbe5d87191"
    },
    latest_message: {
      id: "86ef8bb8-269c-4959-a4f0-213db4e67844",
      subject: "Important customer inquiry",
      preview: "Hi there, I need help with my recent order...",
      type: "email",
      delivered_at: 1548415828,
      from_field: {
        name: "Customer Name",
        address: "customer@example.com"
      },
      to_fields: [
        {
          name: "Support Team",
          address: "support@company.com"
        }
      ]
    }
  },

  async onEnable(context) {
    // Manual setup - no programmatic registration needed
  },

  async onDisable(context) {
    // Manual setup - users manage rules in Missive UI
  },

  async run(context) {
    return [context.payload.body];
  },
});
import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { missiveAuth } from '../common/auth';

export const newContact = createTrigger({
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when new contacts are added to contact books',
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
In the **When should rule trigger?** section:
- Look for **"New contact"** or **"Contact created"** in the available trigger types
- Select this option to trigger on contact creation

### 3. Add Filters (Optional)
Configure filters like:
- **Contact book** - Only contacts added to specific contact books
- **Contact owner** - Only contacts assigned to specific users
- **Has email** - Only contacts with email addresses
- **Has phone** - Only contacts with phone numbers
- **Organization membership** - Contacts belonging to specific organizations
- **Starred contacts** - Only starred contacts

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
- Sync new contacts to your CRM automatically
- Send welcome emails to new business contacts
- Add new contacts to marketing automation workflows
- Alert sales team when new prospects are added
- Backup contact data to external systems
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    rule: {
      id: "45408b30-aa3a-45n1-bh67-0a0cb8da9080",
      description: "New contact webhook",
      type: "new_contact"
    },
    contact: {
      id: "contact_12345678-abcd-1234-5678-1234567890ab",
      first_name: "John",
      last_name: "Doe",
      middle_name: "Michael",
      starred: false,
      contact_book: "487bc080-6631-4edc-830e-1d114eef4ab0",
      created_at: "2023-07-27T10:00:00+00:00",
      modified_at: 1556200645,
      infos: [
        {
          kind: "email",
          label: "work",
          value: "john.doe@company.com"
        },
        {
          kind: "phone_number",
          label: "mobile",
          value: "+1-555-123-4567"
        }
      ],
      memberships: [
        {
          title: "Sales Manager",
          location: "New York",
          group: {
            kind: "organization",
            name: "ABC Corporation"
          }
        }
      ],
      organization: {
        id: "org_12345678-abcd-1234-5678-1234567890ab",
        name: "Your Organization"
      },
      owner: {
        id: "user_12345678-abcd-1234-5678-1234567890ab",
        name: "Contact Owner",
        email: "owner@company.com"
      }
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
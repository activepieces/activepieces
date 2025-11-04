import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { missiveAuth } from '../common/auth';

export const newContactBook = createTrigger({
  name: 'new_contact_book',
  displayName: 'New Contact Book',
  description: 'Triggers when new contact books are created',
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
- Look for **"New contact book"** or **"Contact book created"** in the available trigger types
- Select this option to trigger on contact book creation

### 3. Add Filters (Optional)
Configure filters like:
- **Book owner** - Only contact books created by specific users
- **Organization scope** - Organization vs personal contact books
- **Book name contains** - Contact books with specific naming patterns

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
- Set up automatic contact book backups when new books are created
- Initialize contact book permissions and sharing settings
- Notify administrators when teams create new contact databases
- Create corresponding contact lists in external CRM systems
- Track contact book creation for audit and compliance
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    rule: {
      id: "45408b30-aa3a-45n1-bh67-0a0cb8da9080",
      description: "New contact book webhook",
      type: "new_contact_book"
    },
    contact_book: {
      id: "book_12345678-abcd-1234-5678-1234567890ab",
      name: "Sales Prospects 2024",
      description: "Potential customers for Q1 2024 campaign",
      created_at: "2023-07-27T10:00:00+00:00",
      modified_at: 1556200645,
      organization: {
        id: "org_12345678-abcd-1234-5678-1234567890ab",
        name: "Your Organization"
      },
      owner: {
        id: "user_12345678-abcd-1234-5678-1234567890ab",
        name: "Book Creator",
        email: "creator@company.com"
      },
      permissions: {
        public: false,
        team_access: true,
        organization_access: false
      },
      contact_count: 0
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
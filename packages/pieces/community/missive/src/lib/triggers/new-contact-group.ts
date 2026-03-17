import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { missiveAuth } from '../common/auth';

export const newContactGroup = createTrigger({
  name: 'new_contact_group',
  displayName: 'New Contact Group',
  description: 'Triggers when new contact groups are created',
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
- Look for **"New contact group"** or **"Contact group created"** in the available trigger types
- Select this option to trigger on contact group creation

### 3. Add Filters (Optional)
Configure filters like:
- **Contact book** - Only groups created in specific contact books
- **Group type** - Organizations vs regular groups
- **Group creator** - Only groups created by specific users
- **Group name contains** - Groups with specific naming patterns

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
- Sync new contact groups to external CRM systems
- Set up automatic group permissions and access controls
- Create corresponding lists in marketing automation platforms
- Track contact organization for sales pipeline management
- Initialize group-specific workflows and templates
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    rule: {
      id: "45408b30-aa3a-45n1-bh67-0a0cb8da9080",
      description: "New contact group webhook",
      type: "new_contact_group"
    },
    contact_group: {
      id: "group_12345678-abcd-1234-5678-1234567890ab",
      name: "Enterprise Customers",
      kind: "organization",
      description: "High-value enterprise customer accounts",
      contact_book: "book_12345678-abcd-1234-5678-1234567890ab",
      created_at: "2023-07-27T10:00:00+00:00",
      modified_at: 1556200645,
      organization: {
        id: "org_12345678-abcd-1234-5678-1234567890ab",
        name: "Your Organization"
      },
      creator: {
        id: "user_12345678-abcd-1234-5678-1234567890ab",
        name: "Group Creator",
        email: "creator@company.com"
      },
      member_count: 0,
      tags: ["enterprise", "high-value", "priority"]
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
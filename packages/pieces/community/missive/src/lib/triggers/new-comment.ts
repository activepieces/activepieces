import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { missiveAuth } from '../common/auth';

export const newComment = createTrigger({
  name: 'new_comment',
  displayName: 'New Comment',
  description: 'Triggers when new comments are added to conversations',
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
- Select **"New comment"** from the User actions

### 3. Add Filters (Optional)
Configure filters like:
- **Specific author** - Only comments from certain team members
- **Task comments only** - Only comments on tasks
- **Content contains** - Comments with specific keywords
- **Mentions** - When specific users are mentioned
- **Organization scope** - Organization vs personal conversations

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
- Alert managers when team members comment on critical conversations
- Track task progress through comment notifications
- Route comments with specific keywords to specialized workflows
- Log team collaboration activity to project management tools
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    rule: {
      id: "45408b30-aa3a-45n1-bh67-0a0cb8da9080",
      description: "New comment webhook",
      type: "new_comment"
    },
    conversation: {
      id: "47a57b76-df42-4d8k-927x-80dbe5d87191",
      subject: "Project discussion",
      latest_message_subject: "Re: Project discussion",
      organization: {
        id: "93e5e5d5-11a2-4c9b-80b8-94f3c08068cf",
        name: "Your Organization"
      },
      team: {
        id: "2f618f9e-d3d4-4a01-b7d5-57124ab366b8",
        name: "Project Team",
        organization: "93e5e5d5-11a2-4c9b-80b8-94f3c08068cf"
      },
      assignees: [
        {
          id: "6b52b6b9-9b51-46ad-a4e3-82ef3c45512c",
          name: "Project Manager",
          email: "pm@company.com"
        }
      ],
      shared_labels: [
        {
          id: "146ff5c4-d5la-3b63-b994-76711fn790lq",
          name: "Active Projects"
        }
      ],
      web_url: "https://mail.missiveapp.com/#inbox/conversations/47a57b76-df42-4d8k-927x-80dbe5d87191"
    },
    comment: {
      id: "comment_12345678-abcd-1234-5678-1234567890ab",
      content: "I've reviewed the proposal and have some feedback...",
      author: {
        id: "user_12345678-abcd-1234-5678-1234567890ab",
        name: "Team Member",
        email: "member@company.com"
      },
      created_at: "2023-07-27T10:00:00+00:00",
      is_task: false,
      mentions: ["user_87654321-dcba-4321-8765-ba0987654321"]
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
export function generateTogglWebhookInstructions(
  eventName: string,
  triggerName: string,
  description: string,
  eventDetails: string
): string {
  return `
## Setup Instructions

To use this trigger, you need to manually create a webhook in your Toggl Track account:

### 1. Access Toggl Track Webhooks
- Log in to your Toggl Track account
- Go to **Integrations > Webhooks** (Admin access required)
- Click **"Create Webhook"** or **"Create your first webhook"**

### 2. Configure the Webhook
1. **Name**: Enter a descriptive name (e.g., "Activepieces ${triggerName}")
2. **Events**: Select **"${eventName}"** from the events dropdown
3. **URL Endpoint**: Paste this webhook URL:
\`\`\`text
{{webhookUrl}}
\`\`\`
4. **Secret**: Enter a secret key for security (optional but recommended)

### 3. Complete Setup
- Click **"Add Webhook"**
- Toggl Track will validate your endpoint
- The webhook will appear in your webhooks list when ready

### 4. Verification
- Your webhook status should show as **"Validated"** (happens automatically)
- You can use the **"Test"** option to verify it's working
- ${description}

---

**Requirements:**
- Admin permissions in your Toggl Track workspace
- Limit: 5 webhooks per workspace user

**Event Details:**
${eventDetails}

**Troubleshooting:**
- If status shows **"Not validated"**, click "Test" to trigger auto-validation
- If status shows **"Disabled"**, re-enable it from the 3-dot menu
- If events aren't received, verify you selected "${eventName}" event

**Note:** This trigger uses manual webhook setup as recommended by Toggl Track. **Validation happens automatically** when you click "Test" or when Toggl sends the first ping. The webhook will be managed through your Toggl Track dashboard, not programmatically through ActivePieces.
  `;
}

export const TOGGL_WEBHOOK_EVENTS = {
  CLIENT_CREATED: 'Client created',
  CLIENT_UPDATED: 'Client updated',
  CLIENT_DELETED: 'Client deleted',
  PROJECT_CREATED: 'Project created',
  PROJECT_UPDATED: 'Project updated',
  PROJECT_DELETED: 'Project deleted',
  TAG_CREATED: 'Tag created',
  TAG_UPDATED: 'Tag updated',
  TAG_DELETED: 'Tag deleted',
  TASK_CREATED: 'Task created',
  TASK_UPDATED: 'Task updated',
  TASK_DELETED: 'Task deleted',
  TIME_ENTRY_CREATED: 'Time entry created',
  TIME_ENTRY_UPDATED: 'Time entry updated',
  TIME_ENTRY_DELETED: 'Time entry deleted',
  WORKSPACE_CREATED: 'Workspace created',
  WORKSPACE_UPDATED: 'Workspace updated',
  WORKSPACE_DELETED: 'Workspace deleted',
  WORKSPACE_USER_CREATED: 'Workspace user created',
  WORKSPACE_USER_UPDATED: 'Workspace user updated',
  WORKSPACE_USER_DELETED: 'Workspace user deleted',
  PROJECT_GROUP_CREATED: 'Project group created',
  PROJECT_GROUP_UPDATED: 'Project group updated',
  PROJECT_GROUP_DELETED: 'Project group deleted',
  PROJECT_USER_CREATED: 'Project user created',
  PROJECT_USER_UPDATED: 'Project user updated',
  PROJECT_USER_DELETED: 'Project user deleted',
} as const;

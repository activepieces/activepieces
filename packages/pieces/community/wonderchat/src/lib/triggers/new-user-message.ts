import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { wonderchatAuth } from '../common/auth';

interface WonderchatWebhookPayload {
  type?: string;
  event?: string;
  validation?: boolean;
  message?: {
    id?: string;
    text?: string;
    timestamp?: string;
    user?: {
      id?: string;
      name?: string;
      email?: string;
      phone?: string;
    };
    session?: {
      id?: string;
      chatbot_id?: string;
      started_at?: string;
    };
    metadata?: {
      source?: string;
      page_url?: string;
      user_agent?: string;
      ip_address?: string;
    };
  };
  id?: string;
  text?: string;
  content?: string;
  timestamp?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  user_id?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  session?: {
    id?: string;
    chatbot_id?: string;
    started_at?: string;
  };
  session_id?: string;
  chatbot_id?: string;
  session_started_at?: string;
  metadata?: {
    source?: string;
    page_url?: string;
    user_agent?: string;
    ip_address?: string;
  };
  source?: string;
  page_url?: string;
  user_agent?: string;
  ip_address?: string;
}

export const newUserMessage = createTrigger({
  auth: wonderchatAuth,
  name: 'new_user_message',
  displayName: 'New User Message',
  description: 'Triggers when a user sends a message to the chatbot',
  props: {
    webhookInstructions: Property.MarkDown({
      value: `
## Setup Instructions

To use this trigger, you need to manually set up a webhook in your Wonderchat account:

### 1. Access Wonderchat Dashboard
- Log in to your Wonderchat dashboard at https://app.wonderchat.io
- Navigate to your chatbot settings

### 2. Configure Webhook
- Go to **Settings** or **Integrations** section
- Look for **Webhooks** or **API** settings
- Click **"Add Webhook"** or **"Create New Webhook"**

### 3. Set Webhook URL
- Add the following URL in the **Webhook URL** field:
\`\`\`text
{{webhookUrl}}
\`\`\`
- Set **HTTP Method** to **POST**
- Set **Content Type** to **application/json**

### 4. Select Event Types
- Select **"new_message"** or **"user_message"** from the available event types
- Enable the webhook to start receiving notifications

### 5. Save and Test
- Click **Save** to create the webhook
- Test by sending a message to your chatbot
- Check the webhook logs to ensure messages are being received

---

**Note:** If you don't see webhook options in your Wonderchat dashboard, you may need to contact Wonderchat support to enable webhook functionality for your account.

**Example Use Cases:**
- Trigger when users ask specific questions
- Process all incoming messages for analytics
- Route urgent messages to human support
- Log conversations to your CRM system
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    message: {
      id: "msg_123456789",
      text: "Hello, I need help with my order",
      timestamp: "2024-01-15T10:30:00Z",
      user: {
        id: "user_987654321",
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890"
      },
      session: {
        id: "session_456789123",
        chatbot_id: "bot_789123456",
        started_at: "2024-01-15T10:25:00Z"
      },
      metadata: {
        source: "website",
        page_url: "https://example.com/contact",
        user_agent: "Mozilla/5.0...",
        ip_address: "192.168.1.1"
      }
    }
  },
  async onEnable() {
    // No need to register webhooks programmatically as user will do it manually
    // Wonderchat requires manual webhook setup through their dashboard
  },
  async onDisable() {
    // No need to unregister webhooks as user will do it manually
    // User should disable the webhook in their Wonderchat dashboard
  },
  async run(context) {
    const payload = context.payload.body as WonderchatWebhookPayload;
    
    // Validate payload structure
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid webhook payload received from Wonderchat');
    }

    // Handle webhook validation pings (if Wonderchat sends them)
    if (payload?.type === 'ping' || payload?.event === 'ping' || payload?.validation) {
      return [
        {
          message: 'Webhook validation successful',
          timestamp: new Date().toISOString(),
          status: 'validated',
        },
      ];
    }

    // Check if this is a message event
    if (payload?.type && !['message', 'user_message', 'new_message'].includes(payload.type)) {
      // Not a message event, ignore
      return [];
    }

    // Validate required message fields
    if (!payload?.message && !payload?.text && !payload?.content) {
      throw new Error('Payload missing required message fields');
    }

    // Return structured message data
    return [{
      message: {
        id: payload.message?.id || payload.id || `msg_${Date.now()}`,
        text: payload.message?.text || payload.text || payload.content || '',
        timestamp: payload.message?.timestamp || payload.timestamp || new Date().toISOString(),
        user: payload.message?.user || payload.user || {
          id: payload.user_id || 'unknown',
          name: payload.user_name || 'Unknown User',
          email: payload.user_email || null,
          phone: payload.user_phone || null
        },
        session: payload.message?.session || payload.session || {
          id: payload.session_id || 'unknown',
          chatbot_id: payload.chatbot_id || context.auth.chatbotId,
          started_at: payload.session_started_at || new Date().toISOString()
        },
        metadata: payload.message?.metadata || payload.metadata || {
          source: payload.source || 'webhook',
          page_url: payload.page_url || null,
          user_agent: payload.user_agent || null,
          ip_address: payload.ip_address || null
        }
      },
      raw_payload: payload
    }];
  },
});

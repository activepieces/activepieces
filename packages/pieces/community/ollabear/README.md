# Ollabear

Automate the [Ollabear](https://ollabear.com) AI chat platform from Activepieces.

**Triggers:** Conversation Created, Conversation Closed, New Message (webhook-based; deliveries are HMAC-SHA256 verified).

**Actions:** Send Message, Set Conversation Status, Set Conversation Tags, Get Conversation.

**Auth:** a Personal Access Token (`pat_…`) — mint one in the Ollabear dashboard under **Settings → API Tokens** using the **Automation (Activepieces)** preset (grants `conversations_read/write`, `messages_write`, `webhooks_write`). Not the public `qk_` widget key.

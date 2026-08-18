import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { createGraphClient, getAppOnlyToken, GRAPH_DEFAULT_SCOPE, withGraphRetry } from './common/graph';

const authDesc = `
Register a **single-tenant** Azure Bot in your own Microsoft tenant, then paste its credentials below. Microsoft deprecated multi-tenant bots, so the bot must live in the **same tenant** you use Microsoft Teams from — sign in to the [Azure Portal](https://portal.azure.com) with an admin of that tenant.

📖 **[Full step-by-step guide (bot setup + packaging the Teams app)](https://github.com/activepieces/activepieces/blob/main/packages/pieces/community/microsoft-teams-bot/teams-app/README.md)** — the steps below are the short version.

**1. Create the Azure Bot**
- Create an **Azure Bot** resource → **Pricing tier: Free (F0)** → **Type of App: Single Tenant** → **Create new Microsoft App ID**. This creates the App Registration.

**2. Enable the Teams channel**
- On the Bot resource → **Channels** → add **Microsoft Teams** and Apply. (Without this, installing the app fails.)

**3. Set the messaging endpoint**
On the Bot resource → **Configuration** → **Messaging endpoint**, paste:

\`\`\`text
{{frontendUrl}}/api/v1/teams-bot/webhook
\`\`\`

This is how the bot learns where to post — the app **must** be installed for sending to work.

**4. Create a secret**
- App Registration → **Certificates & secrets** → **New client secret** → copy the **Value** (not the Secret ID).

**5. Grant Graph permissions (for the Team & Channel dropdowns)**
- App Registration → **API permissions** → **Add → Microsoft Graph → Application permissions** → add \`Team.ReadBasic.All\` and \`Channel.ReadBasic.All\` → **Grant admin consent** (both must show green).

**6. Install the bot in your team**
- Package your Teams app (\`manifest.json\` \`botId\` = this App ID) and add it to the team/channel you want to post to. On install, the bot registers itself so Activepieces can message that channel.

Then fill in:
- **Bot App ID** — the Application (client) ID
- **Bot App Secret** — the client secret **Value**
- **Tenant ID** — your Directory (tenant) ID`;

export const microsoftTeamsBotAuth = PieceAuth.CustomAuth({
  description: authDesc,
  required: true,
  props: {
    appId: Property.ShortText({
      displayName: 'Bot App ID',
      required: true,
    }),
    appSecret: PieceAuth.SecretText({
      displayName: 'Bot App Secret',
      required: true,
    }),
    tenantId: Property.ShortText({
      displayName: 'Tenant ID',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const token = await getAppOnlyToken({
        tenantId: auth.tenantId,
        appId: auth.appId,
        appSecret: auth.appSecret,
        scope: GRAPH_DEFAULT_SCOPE,
      });
      const client = createGraphClient(token);
      await withGraphRetry(() => client.api('/teams').top(1).get());
      return { valid: true };
    } catch (error) {
      const detail =
        (error as { response?: { body?: unknown } })?.response?.body ??
        (error as { body?: unknown })?.body ??
        (error as Error)?.message ??
        error;
      return {
        valid: false,
        error: `Auth failed: ${JSON.stringify(detail)}`,
      };
    }
  },
});

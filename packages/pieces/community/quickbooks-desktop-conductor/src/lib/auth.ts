import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { conductorClient } from './common/client';

const authDescription = `
This piece connects to QuickBooks Desktop through [Conductor](https://conductor.is) — Activepieces
cannot talk to QuickBooks Desktop directly, since it has no cloud API of its own.

1. In your Conductor dashboard, go to **Settings → API Keys** and copy your **Secret Key**.
2. Under **End-Users**, select (or create) the end-user connected to this QuickBooks Desktop
   company file and copy their **End-User ID** (starts with \`end_usr_\`).
3. The end-user must have already completed Conductor's auth flow and installed the QuickBooks
   Web Connector — Conductor's dashboard shows the connection as "Connected" once QuickBooks
   Desktop is reachable. If it shows "Not connected," fix that in Conductor before connecting here.
4. **Top setup mistake — read before finishing step 3:** when QuickBooks Desktop first asks to
   authorize the Web Connector, **choose the option that keeps access even when QuickBooks Desktop
   isn't running** (not "ask every time"). Picking the wrong option doesn't error — it just makes
   every sync silently do nothing until someone is sitting at the QuickBooks Desktop machine to
   approve it, which usually isn't noticed until a customer asks why nothing has synced in days.
   See this piece's README for the full walkthrough.
`;

export const quickbooksDesktopConductorAuth = PieceAuth.CustomAuth({
  displayName: 'Connection',
  description: authDescription,
  required: true,
  props: {
    secretKey: PieceAuth.SecretText({
      displayName: 'Conductor Secret Key',
      description: 'From your Conductor dashboard, Settings → API Keys.',
      required: true,
    }),
    endUserId: Property.ShortText({
      displayName: 'Conductor End-User ID',
      description: 'The end-user ID for this QuickBooks Desktop company file (starts with end_usr_).',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await conductorClient.healthCheck({
        secretKey: auth.secretKey,
        endUserId: auth.endUserId,
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Could not connect to QuickBooks Desktop through Conductor.',
      };
    }
  },
});

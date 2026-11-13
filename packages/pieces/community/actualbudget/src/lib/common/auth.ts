import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { ActualBudgetError, withBudget } from './client';

export const actualBudgetAuth = PieceAuth.CustomAuth({
  description: `Connect to your self-hosted Actual Budget server (version 26.x recommended; the piece uses the official @actual-app/api 26.10.0, and very old servers may refuse it).
1. **Server URL**: the address you open Actual on, e.g. \`https://actual.example.com\` or \`http://localhost:5006\`.
2. **Password**: the server password you log in to Actual with.
3. **Sync ID**: in Actual open **Settings → Show advanced settings → Sync ID**.
4. **End-to-end encryption password**: only if you turned on end-to-end encryption for this budget.`,
  props: {
    server_url: Property.ShortText({
      displayName: 'Server URL',
      description:
        'The URL of your Actual server, e.g. https://actual.example.com',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'The password you use to log in to the server',
      required: true,
    }),
    sync_id: PieceAuth.SecretText({
      displayName: 'Sync ID',
      description: 'Settings → Show advanced settings → Sync ID',
      required: true,
    }),
    encryption_password: PieceAuth.SecretText({
      displayName: 'End-to-end encryption password',
      description: 'Only if end-to-end encryption is turned on for this budget',
      required: false,
    }),
  },
  required: true,
  validate: async ({ auth }) => {
    try {
      await withBudget({ auth, fn: async () => undefined });
      return { valid: true };
    } catch (error) {
      if (error instanceof ActualBudgetError) {
        return { valid: false, error: error.message };
      }
      return {
        valid: false,
        error: `Could not open the budget: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  },
});

import { AppConnectionType, PieceAuth, tryCatch } from '@activepieces/pieces-framework';
import { filetopdfApi } from './common/api';

export const filetopdfAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your FileToPDF API key (format `sk_live_...`).\n\nGet one in seconds: open [filetopdf.dev](https://filetopdf.dev) and click **Get a free API key** on the home page for an instant trial key (no account, 10 free conversions), or create one in the [dashboard](https://filetopdf.dev).',
  required: true,
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() =>
      filetopdfApi.getAccount({
        auth: { type: AppConnectionType.SECRET_TEXT, secret_text: auth },
      })
    );
    if (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid API Key.',
      };
    }
    return { valid: true };
  },
});

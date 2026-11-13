import { PieceAuth } from '@activepieces/pieces-framework';
import { convertApi } from './common/client';

export const convertApiAuth = PieceAuth.SecretText({
    displayName: 'API Token',
    description: `To get your API token:
1. Sign in to [ConvertAPI](https://www.convertapi.com/a).
2. Open **Authentication** (https://www.convertapi.com/a/authentication).
3. Copy an existing **API Token**, or create a new one, and paste it here.`,
    required: true,
    validate: async ({ auth }) => convertApi.checkToken({ apiKey: auth }),
});

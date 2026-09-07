import { PieceAuth } from '@activepieces/pieces-framework';

export const scruppAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description:
    'Create a key in Scrupp under **Settings → API Keys** ([app.scrupp.com](https://app.scrupp.com)). API access is included on every paid plan.',
});

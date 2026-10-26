import { PieceAuth } from '@activepieces/pieces-framework';

export const calcomAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Open [Settings → Developer → API Keys](https://app.cal.com/settings/developer/api-keys) in Cal.com.
2. Create a new key and choose when it expires.
3. Copy the key (it starts with \`cal_\`) and paste it here.`,
  required: true,
});

import { PieceAuth } from '@activepieces/pieces-framework';

export const send21Auth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `Scoped key from [API keys](https://send21.io/api-keys). Keys look like \`s21_\` and cannot move funds: a person signs and sends every payment from their own wallet.

Use \`drafts:write\` to create pay links and drafts, \`drafts:read\` to read them, and \`webhooks:manage\` so the trigger can register its endpoint. Paste the key only, without the word Bearer.`,
});

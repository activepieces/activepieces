import { PieceAuth } from '@activepieces/pieces-framework';

export const comfyIcuAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `You can obtain API key from [Account Settings](https://comfy.icu/account).`,
});

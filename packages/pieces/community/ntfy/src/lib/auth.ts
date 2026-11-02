import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const ntfyAuth = PieceAuth.CustomAuth({
  description: '1. Log in to your ntfy server (https://ntfy.sh or your own).\n2. Open **Account** → **Access tokens**.\n3. Create a token, or copy an existing one; note when it expires.\n4. Paste the server address and the token below. Public topics on servers without login need no token.',
  props: {
    base_url: Property.ShortText({
      displayName: 'Server URL',
      description: 'Your ntfy server address, e.g. https://ntfy.sh',
      required: true,
    }),
    access_token: PieceAuth.SecretText({
      displayName: 'Access Token',
      description: 'Leave empty for public topics on servers without login.',
      required: false,
    }),
  },
  required: true,
});

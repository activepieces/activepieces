import { PieceAuth } from '@activepieces/pieces-framework';

export const MagicSlidesAuth = PieceAuth.SecretText({
  displayName: 'MagicSlides API Key',
  description: `**Enter your MagicSlides Access ID (API key).**
---
### How to obtain your API key
1. Sign up or log in at [magicslides.app](https://www.magicslides.app/).
2. Go to **Dashboard → API**.
3. Copy your **Access ID** and paste it here.
`,
  required: true,
});

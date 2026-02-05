import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const MagicSlidesAuth = PieceAuth.CustomAuth({
  
  description: `**Enter your MagicSlides Access ID (API key).**
---
### How to obtain your API key
1. Sign up or log in at [magicslides.app](https://www.magicslides.app/).
2. Go to **Dashboard → API**.
3. Copy your **Access ID** and paste it here.
4. And copy your registered email address and paste it here.
`,
  required: true,
  props: {
    accessId: Property.ShortText({
      displayName: 'Access ID',
      description: 'Enter your MagicSlides Access ID',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Enter your registered email address.',
      required: true,
    }),
  },
});

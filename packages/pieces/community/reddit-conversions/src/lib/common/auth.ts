import { PieceAuth, Property } from '@activepieces/pieces-framework';

const markdownDescription = `
Send server-side conversion events to Reddit with the **Conversions API (v3)**.

**1. Find your Pixel ID**
1. Open **Reddit Ads Manager** (ads.reddit.com).
2. From the main menu open **Events Manager**.
3. Select the pixel you want to send conversions to (or create one).
4. Copy the **Pixel ID** shown for that pixel (it looks like \`a2_xxxxxxxxxxxx\`).

**2. Generate your Conversion Access Token**
1. In **Events Manager**, open the **Conversions API** tab for your pixel.
2. Click **Generate access token** (or copy the existing one) and paste it below.

The access token is a non-expiring secret. The Reddit user generating it must have access to the ad account that owns the pixel.
`;

export const redditConversionsAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    conversion_token: PieceAuth.SecretText({
      displayName: 'Conversion Access Token',
      description:
        'The Conversion Access Token generated in Events Manager (Conversions API tab).',
      required: true,
    }),
    pixel_id: Property.ShortText({
      displayName: 'Pixel ID',
      description:
        'The ID of the pixel that receives these conversions (e.g. "a2_xxxxxxxxxxxx"). Found in Events Manager.',
      required: true,
    }),
  },
});

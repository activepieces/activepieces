import { PieceAuth, Property } from '@activepieces/pieces-framework';

const markdownDescription = `
Send server-side conversion events to Pinterest with the **Conversions API**.

**1. Get your Conversion Access Token**
1. Open **Pinterest Ads Manager**.
2. Go to **Ad Account Overview → Conversions → Conversions API → Set up API**.
3. Choose **Conversion access token** and click **Generate new token**.
4. Copy the token and paste it below.

**2. Find your Ad Account ID**
It is the numeric ID shown in Ads Manager (also in the URL as \`advertiserId\`).

Your token's user must own the ad account or have an Admin, Analyst, Audience, or Campaign role via Business Access.
`;

export const pinterestConversionsAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    conversion_token: PieceAuth.SecretText({
      displayName: 'Conversion Access Token',
      description:
        'The Conversion access token generated in Ads Manager (Conversions → Conversions API).',
      required: true,
    }),
    ad_account_id: Property.ShortText({
      displayName: 'Ad Account ID',
      description: 'The numeric ID of the ad account that owns these conversions.',
      required: true,
    }),
  },
});

import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { provenExpertCommon } from ".";

export const provenExpertAuth = PieceAuth.CustomAuth({
  description: `Connect your ProvenExpert account to access reviews, surveys, and invitations.

**How to get your API credentials:**
1. Log in to your [ProvenExpert account](https://www.provenexpert.com/).
2. Go to **integrations ** from the left side panel.
3.  Copy your **Username** and **API Key**.
4. Paste them into the fields below.`,
  required: true,
  props: {
    api_id: Property.ShortText({
      displayName: 'Username',
      description: 'Your ProvenExpert API ID. Generated in',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your ProvenExpert API Key. Generated alongside the API ID in My Account → API Access.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await provenExpertCommon.apiCall({
        auth,
        path: '/profile/get',
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API ID or API Key. Double-check your credentials in ProvenExpert under My Account → API Access.',
      };
    }
  },
});
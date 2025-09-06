import { PieceAuth, createPiece } from "@activepieces/pieces-framework";

// Note: As you build actions and triggers, you will import them here.
// Example: import { createContact } from "./lib/actions/create-contact.ts";

export const zohoCampaignsAuth = PieceAuth.OAuth2({
    description: `
    **Instructions to get your Client ID and Client Secret:**
    1. Go to the [Zoho API Console](https://api-console.zoho.com/).
    2. Click on **Add Client** and choose **Server-based Applications**.
    3. Give your client a name (e.g., "Activepieces Integration").
    4. Enter a Homepage URL (e.g., \`https://www.activepieces.com/\`).
    5. For **Authorized Redirect URIs**, paste this value: \`{{redirectUrl}}\`
    6. Click **Create**.
    7. Your **Client ID** and **Client Secret** will be displayed. Copy and paste them into the fields on the connection dialog.
    `,
    authUrl: "https://accounts.zoho.com/oauth/v2/auth",
    tokenUrl: "https://accounts.zoho.com/oauth/v2/token",
    required: true,
    scope: [
        'ZohoCampaigns.campaign.ALL',
        'ZohoCampaigns.contact.ALL',
    ],
});

export const zohoCampaigns = createPiece({
  displayName: "Zoho Campaigns", // Corrected the display name for better readability
  auth: zohoCampaignsAuth, // Implemented OAuth2 authentication
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/zoho-campaigns.png",
  authors: [
      "your-github-username" 
    ],
  actions: [
    
  ],
  triggers: [
    
  ],
});
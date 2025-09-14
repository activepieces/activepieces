import { PieceAuth, Property } from "@activepieces/pieces-framework";

export const MagicalapiAuth = PieceAuth.SecretText({
    displayName: 'Magical API Key',
    description: `
Get your Magical API Key from the Magical API dashboard.
To get your API key:
1. Sign up or log in to your Magical API account at https://panel.magicalapi.com/api-info
2. Go to the API Keys section in your dashboard
3. Create a new API key or use an existing one
`,
    required: true,

})
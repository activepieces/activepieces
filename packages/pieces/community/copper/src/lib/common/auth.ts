import { PieceAuth } from "@activepieces/pieces-framework";

export const copperAuth = PieceAuth.CustomAuth({
  description: `
  To authenticate with Copper:
  
  1. Go to your Copper web app
  2. Navigate to System settings > API Keys
  3. Click the 'GENERATE API KEY' button
  4. Label the key for its unique purpose
  5. Copy the API key and your email address
  6. Paste them below
  `,
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: "API Key",
      description: "Your Copper API key",
      required: true,
    }),
    userEmail: PieceAuth.SecretText({
      displayName: "User Email",
      description: "The email address of the user who generated the API key",
      required: true,
    }),
  },
});

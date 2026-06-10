import { PieceAuth } from "@activepieces/pieces-framework";

export const leapAiAuth = PieceAuth.SecretText({
  displayName: "Leap AI API Key",
  description: `Provide your Leap AI API key. 

**How to get your API key:**
1. Go to [app.tryleap.ai](https://app.tryleap.ai)
2. Click on **Settings** in the left sidebar (bottom)
3. Navigate to the **API** section
4. Click **Create API Key** to generate a new key
5. Copy and paste the key here`,
  required: true,
});
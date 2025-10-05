import { PieceAuth } from "@activepieces/pieces-framework";


export const SocialKitAuth = PieceAuth.SecretText({
    displayName: 'SocialKit Access Key',
    description: `**Enter your SocialKit Access Key.**
---
### How to obtain your Access Key
1. Visit [socialkit.dev](https://www.socialkit.dev) and log in.
2. Open your project dashboard.
3. Go to the **Access Keys** section.
4. Copy your Access Key and paste it here.
`,
    required: true,

});

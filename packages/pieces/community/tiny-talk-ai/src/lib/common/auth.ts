import { PieceAuth } from "@activepieces/pieces-framework";

export const tinyTalkAiAuth = PieceAuth.SecretText({
    displayName:'API Key',
    required:true,
    description:`You can obtain API key from [Dashboard Settings](https://dashboard.tinytalk.ai/).`
})
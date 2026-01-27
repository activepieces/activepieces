import { PieceAuth } from "@activepieces/pieces-framework";

export const doctlyAuth = PieceAuth.SecretText({
    displayName:'API Key',
    required:true,
    description:`You can obtain API key from [API Settings](https://doctly.ai/keys).`
})
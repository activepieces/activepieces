import { PieceAuth } from "@activepieces/pieces-framework";

export const opportifyAuth = PieceAuth.SecretText({
    displayName:'API Key',
    required:true,
    description:`You can obtain your API key from [API Key List](https://app.opportify.ai/api-keys/list).`
})
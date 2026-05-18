import { PieceAuth } from "@activepieces/pieces-framework";

export const dashworksAuth = PieceAuth.SecretText({
    displayName:'API Key',
    required:true,
    description:`You can obtain API key from [API Settings](https://web.dashworks.ai/admin/api-keys).`
})
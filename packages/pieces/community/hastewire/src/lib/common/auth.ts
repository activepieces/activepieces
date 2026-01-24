import { PieceAuth } from "@activepieces/pieces-framework";

export const hastewireAuth = PieceAuth.SecretText({
    displayName:'API Key',
    required:true,
    description:`You can obtain API key from [Settings](https://hastewire.com/humanizer/account/api-keys).`
})
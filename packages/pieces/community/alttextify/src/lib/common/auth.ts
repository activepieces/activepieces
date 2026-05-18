import { PieceAuth } from "@activepieces/pieces-framework";

export const alttextifyAuth = PieceAuth.SecretText({
    displayName:'API Key',
    required:true,
    description:'To obtain an API key, navigate to the [API keys](https://alttextify.net/settings/apikeys) section within your account settings.'
})
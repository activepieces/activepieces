
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const bonjoro = createPiece({
  displayName: "Bonjoro",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/bonjoro.png",
  authors: [],
  actions: [],
  triggers: [],
});


/*
https://www.bonjoro.com/api/v2/greets

{
  "note": "This is a test note",
  "custom_attributes": {
    "product": "test"
  },
  "profiles": [
    "joe@workmanmail.com"
  ]
}

https://www.bonjoro.com/api/v2/campaigns
https://www.bonjoro.com/api/v2/users
https://www.bonjoro.com/api/v2/message-templates

https://www.bonjoro.com/settings/api#/
https://vimily.github.io/bonjoro-api-docs/
*/
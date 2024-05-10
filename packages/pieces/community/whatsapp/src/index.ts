
import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { sendMessage } from "./lib/actions/send-message";
import { sendMedia } from "./lib/actions/send-media";

const markdown = `
To Obtain a Phone Number ID and a Permanent System User Access Token, follow these steps:

1. Go to https://developers.facebook.com/
2. Make a new app, Select Other for usecase.
3. Choose Business as the type of app.
4. Add new Product -> WhatsApp.
5. Navigate to WhatsApp Settings > API Setup.
6. Select a phone number and copy its Phone number ID.
7. Login to your [Meta Business Manager](https://business.facebook.com/).
8. Click on Settings.
9. Create a new System User with access over the app and copy the access token.
`;

export const whatsappAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdown,
  props: {
    access_token: PieceAuth.SecretText({
      displayName: 'System User Access Token',
      description: 'The system user access token of your WhatsApp business account',
      required: true,
    }),
    phoneNumberId: Property.ShortText({
      displayName: 'Phone Number ID',
      description: 'The phone number ID of your WhatsApp business account',
      required: true,
    }),
  },
});


export const whatsapp = createPiece({
  displayName: "WhatsApp Business",
  description: 'Manage your WhatsApp business account',
  auth: whatsappAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: "https://cdn.activepieces.com/pieces/whatsapp.png",
  authors: ["LevwTech"],
  actions: [sendMessage, sendMedia],
  triggers: [],
});

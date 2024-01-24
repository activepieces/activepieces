
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { heartBeatCreateUser } from "./lib/actions/create-user";
import { createCustomApiCallAction } from "@activepieces/pieces-common";

const markdownPropertyDescription = `
  1. Login to your Heartbeat account
  2. On the bottom-left, click on 'Admin Settings'
  3. On the left panel, click on 'API Keys'
  5. Click on 'Create API Key'
  6. On the popup form, Enter the 'Label' to name the Key
  7. Copy the API key and paste it below.
`;

export const heartbeatAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownPropertyDescription,
  required: true,
});

export const Heartbeat = createPiece({
  displayName: "Heartbeat",
  auth: heartbeatAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://canny.io/images/1c45977e303cc49b7230311e0eb3e87e.png", //TODO: replace logo
  authors: ['kanarelo'],
  actions: [heartBeatCreateUser, createCustomApiCallAction({
    auth: heartbeatAuth,
    baseUrl: () => 'https://api.heartbeat.chat/v0',
    authMapping: (auth) => {
      return {
        'Authorization': `Bearer ${auth}`
      }
    }
  })],
  triggers: [],
});

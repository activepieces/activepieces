
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createCustomApiCallAction } from '@activepieces/pieces-common';


const markdown = `
MySendingBox API keyis available under the developer portal.
(https://app.mysendingbox.fr/account/keys)`;

export const mySendingBoxPieceAuth = PieceAuth.CustomAuth({
  description: markdown,
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
});

export const mysendingbox = createPiece({
  displayName: "Mysendingbox",
  auth: mySendingBoxPieceAuth,
  minimumSupportedRelease: '0.78.0',
  logoUrl: "https://cdn.activepieces.com/pieces/mysendingbox.png",
  authors: ['Blightwidow'],
  actions: [
    createCustomApiCallAction({
      baseUrl: () => {
        return "https://api.mysendingbox.fr/v1";
      },
      auth: mySendingBoxPieceAuth,
      authMapping: async (auth) => ({
        Authorization: `Basic ${btoa(`${auth.props.apiKey}:`)}`,
      }),
    }),],
  triggers: [],
});

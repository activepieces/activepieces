
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { shortenLink } from "./lib/actions/shorten-link.action";

const markdownDescription = `
Follow the instructions to get your API key:
1. Visit the following website: https://app.bitly.com/settings/api/.
2. Once on the website, locate and click on the option to obtain your Bitly API Key.
`;

export const bitlyAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: "API Key",
  required: true,
});


export const bitly = createPiece({
  displayName: "Bitly",
  auth: bitlyAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/bitly.png",
  authors: ["PFernandez98"],
  actions: [shortenLink],
  triggers: [],
});
    
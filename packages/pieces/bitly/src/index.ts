
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createShortUrl } from "./lib/actions/create-short-url.action";
import { getBitlinkDetails } from "./lib/actions/get-bitlink-details.action";
import { deleteBitlink } from "./lib/actions/delete-bitlink.action";
import { createBitlink } from "./lib/actions/create-bitlink.action";

const markdownDescription = `
Follow these instructions to get your Bitly Token:
1. Visit the following website: https://app.bitly.com/settings/api/
2. Once on the website, locate and click on the option to obtain your Bitly Token
`;

export const bitlyAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: "Bitly Token",
  required: true,
})

export const bitly = createPiece({
  description: "Shorten URLs with Bitly.",
  displayName: "Bitly",
  auth: bitlyAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn2.iconfinder.com/data/icons/social-icons-33/128/Bitly-512.png",
  authors: ["Pablo Fernandez <https://github.com/pfernandez98>"],
  actions: [createShortUrl, getBitlinkDetails, deleteBitlink, createBitlink],
  triggers: [],
});

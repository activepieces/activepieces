
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { shortenUrl } from "./lib/actions/shorten-url.action";
import { deleteBitlink } from "./lib/actions/delete-bitlink.action";
import { retrieveBitlink } from "./lib/actions/retrieve-bitlink.action";
import { createQrFromBitlink } from "./lib/actions/create-qr.action";

const markdownDescription = `
Follow these instructions to get your Bitly Token:
1. Visit the following website: https://app.bitly.com/settings/api/
2. Once on the website, locate and click on the option to obtain your Bitly Token
`

export const bitlyAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: "Bitly Token",
  required: true,
  validate: async (auth) => {
    try {
      const response = await fetch('https://api-ssl.bitly.com/v4/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.auth as string}`
        }
      })
      if (response.status === 401) {
        return {
          valid: false,
          error: 'Invalid Bitly Token'
        }
      }
      return {
        valid: true,
      }
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid Bitly Token'
      }
    }
  }
})

export const bitly = createPiece({
  displayName: "Bitly",
  auth: bitlyAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn2.iconfinder.com/data/icons/social-icons-33/128/Bitly-512.png',
  authors: [],
  actions: [shortenUrl, deleteBitlink, retrieveBitlink, createQrFromBitlink],
  triggers: [],
});


import { createPiece} from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { getCallAction } from "./lib/actions/get-call";
import { newCallCreatedTrigger } from "./lib/triggers/new-call-created";
import { leexiAuth } from "./lib/common/auth";
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { BASE_URL } from "./lib/common/constants";

export const leexi = createPiece({
  displayName: "Leexi",
  description:'AI Notetaker',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.PRODUCTIVITY],
  auth: leexiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/leexi.png",
  authors: ['kishanprmr'],
  actions: [getCallAction,
    createCustomApiCallAction({
      auth:leexiAuth,
      baseUrl:()=>BASE_URL,
      authMapping:async (auth)=>{
        return{
          Authorization: `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString(
            'base64'
          )}`
        }
      }
    })
  ],
  triggers: [newCallCreatedTrigger],
});

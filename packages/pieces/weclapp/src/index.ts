
import { createPiece } from "@activepieces/pieces-framework";
import actions from "./lib/actions";
import { weclappCommon } from "./lib/common";
import triggers from "./lib/triggers";

export const weclapp = createPiece({
  displayName: "WeClapp",
  auth: weclappCommon.auth,
  logoUrl: "https://cdn.activepieces.com/pieces/weclapp.png",
  authors: ['JanHolger'],
  actions,
  triggers,
});

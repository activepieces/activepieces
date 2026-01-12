import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { giftbitAuth } from "./lib/common/auth";
import { sendReward } from "./lib/actions/send-reward";

export { giftbitAuth };

export const giftbit = createPiece({
  displayName: "Giftbit",
  description: "Send digital gift cards and rewards to recipients via email.",
  auth: giftbitAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/giftbit.png",
  categories: [PieceCategory.MARKETING],
  authors: ["onyedikachi-david"],
  actions: [sendReward],
  triggers: [],
});

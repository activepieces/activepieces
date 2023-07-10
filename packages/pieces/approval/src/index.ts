import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { approvalAction } from "./lib/actions/approval";

export const approval = createPiece({
  displayName: "Approval",
  auth: PieceAuth.None(),
  logoUrl: "https://cdn.activepieces.com/pieces/approval.svg",
  authors: ['khaledmashaly'],
  actions: [approvalAction],
  triggers: [],
});

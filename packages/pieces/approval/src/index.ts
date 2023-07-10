import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { approvalLink } from "./lib/actions/approval-link";

export const approval = createPiece({
  displayName: "Approval",
  auth: PieceAuth.None(),
  logoUrl: "https://cdn.activepieces.com/pieces/approval.svg",
  authors: ['khaledmashaly'],
  actions: [approvalLink],
  triggers: [],
});

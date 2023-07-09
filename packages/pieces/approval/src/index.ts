import { PieceAuth, createPiece } from "@activepieces/pieces-framework";

export const approval = createPiece({
  displayName: "Approval",
  auth: PieceAuth.None(),
  logoUrl: "https://cdn.activepieces.com/pieces/approval.png",
  authors: [],
  actions: [],
  triggers: [],
});

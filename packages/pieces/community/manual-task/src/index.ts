
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createTask } from "./lib/actions/create-task";
import { PieceCategory } from "@activepieces/shared";

export const manualTask = createPiece({
  displayName: "Manual Task",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/approval.svg",
  authors: ['hazemadelkhalel'],
  categories: [PieceCategory.CORE, PieceCategory.FLOW_CONTROL],
  actions: [createTask],
  triggers: [],
});
    

import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createTask } from "./lib/actions/create-task";
import { PieceCategory } from "@activepieces/shared";

export const manualTask = createPiece({
  displayName: "Manual Tasks",
  description: "Create tasks for project members to take actions, useful for approvals, reviews, and manual actions performed by humans",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.48.0',
  logoUrl: "https://cdn.activepieces.com/pieces/approval.svg",
  authors: ['hazemadelkhalel'],
  categories: [PieceCategory.CORE, PieceCategory.FLOW_CONTROL],
  actions: [createTask],
  triggers: [],
});
    
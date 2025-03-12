
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createTask } from "./lib/actions/create-task";

export const manualTask = createPiece({
  displayName: "Manual-task",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/approval.svg",
  authors: ['hazemadelkhalel'],
  actions: [createTask],
  triggers: [],
});
    
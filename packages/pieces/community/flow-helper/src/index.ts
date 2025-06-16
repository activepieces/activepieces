import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { getRunId } from "./lib/actions/get-run-id";
import { failFlow } from "./lib/actions/fail-flow";

export const flowHelper = createPiece({
  displayName: "Flow Helper",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/flow-helper.svg",
  authors: ["AbdulTheActivePiecer","AnkitSharmaOnGithub"],
  actions: [getRunId, failFlow],
  triggers: [],
});

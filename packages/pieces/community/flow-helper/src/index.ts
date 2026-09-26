import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { getRunId } from "./lib/actions/get-run-id";
import { failFlow } from "./lib/actions/fail-flow";
import { stopFlow } from "./lib/actions/stop-flow";
import { waitForResume } from "./lib/actions/wait-for-resume";
import { createWaitpoint } from "./lib/actions/create-waitpoint";

export const flowHelper = createPiece({
  displayName: "Flow Helper",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.82.0',
  logoUrl: "https://cdn.activepieces.com/pieces/flow-helper.svg",
  authors: ["AbdulTheActivePiecer","AnkitSharmaOnGithub"],
  actions: [getRunId, failFlow, stopFlow, createWaitpoint, waitForResume],
  triggers: [],
});

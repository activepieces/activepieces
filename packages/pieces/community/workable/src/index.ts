
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { getCandidate } from "./lib/actions/get-candidate";
import { getMembers } from "./lib/actions/get-members";
import { getJob } from "./lib/actions/get-job";
import { getStages } from "./lib/actions/get-stages";
import { moveCandidate } from "./lib/actions/move-candidate";
import { rateCandidate } from "./lib/actions/rate-candidate";
import { newCandidate } from "./lib/triggers/new-candidate";

export const workableAuth = PieceAuth.SecretText({
    displayName: "API Key",
    description: "Enter API Key",
    required: true
  })


export const workable = createPiece({
  displayName: "Workable",
  auth: workableAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/workable.png",
  authors: [],
  actions: [getCandidate, getMembers, getJob, getStages, moveCandidate, rateCandidate],
  triggers: [newCandidate],
});

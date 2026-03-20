
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { getCandidate } from "./lib/actions/get-candidate";
import { getMembers } from "./lib/actions/get-members";
import { getJob } from "./lib/actions/get-job";
import { getStages } from "./lib/actions/get-stages";
import { moveCandidate } from "./lib/actions/move-candidate";
import { rateCandidate } from "./lib/actions/rate-candidate";
import { newCandidate } from "./lib/triggers/new-candidate";
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { PieceCategory } from "@activepieces/shared";
import { workableAuth } from './lib/auth';

 

export const workable = createPiece({
  displayName: "Workable",
  auth: workableAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/workable.png",
  categories:[PieceCategory.HUMAN_RESOURCES],
  authors: ['Cloudieunnie'],
  actions: [
    getCandidate, 
    getMembers, 
    getJob, 
    getStages, 
    moveCandidate, 
    rateCandidate,
    createCustomApiCallAction({
      baseUrl: () => `https://workable.com/spi/v3/`,
      auth: workableAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
        Accept: 'application/json'
      })
    })
  ],
  triggers: [
    newCandidate
  ],
});


import { createPiece } from "@activepieces/pieces-framework";

import actions from "./lib/actions";
import triggers from './lib/triggers'

export const clockodo = createPiece({
  displayName: "Clockodo",
  logoUrl: "https://cdn.activepieces.com/pieces/clockodo.png",
  authors: ["JanHolger"],
  actions,
  triggers
});

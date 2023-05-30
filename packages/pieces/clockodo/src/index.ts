
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";

import actions from "./lib/actions";
import triggers from './lib/triggers'

export const clockodo = createPiece({
  name: "clockodo",
  displayName: "Clockodo",
  logoUrl: "https://cdn.activepieces.com/pieces/clockodo.png",
  version: packageJson.version,
  authors: ["JanHolger"],
  actions,
  triggers
});

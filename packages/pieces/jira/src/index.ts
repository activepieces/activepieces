
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import actions from "./lib/actions";
import triggers from './lib/triggers'

export const jira = createPiece({
  name: "jira",
  displayName: "Jira",
  logoUrl: "https://cdn.activepieces.com/pieces/jira.png",
  version: packageJson.version,
  authors: ['JanHolger'],
  actions,
  triggers,
});

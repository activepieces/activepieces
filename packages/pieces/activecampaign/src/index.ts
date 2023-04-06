
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";

export const activecampaign = createPiece({
  name: "activecampaign",
  displayName: "Activecampaign",
  logoUrl: "https://cdn.activepieces.com/pieces/activecampaign.png",
  version: packageJson.version,
  authors: [],
  actions: [],
  triggers: [],
});

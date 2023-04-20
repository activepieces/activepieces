
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";

import { mondayCreateAnItem } from "./lib/actions/create-item";
import { mondayTriggers } from "./lib/triggers";

export const monday = createPiece({
  name: "monday",
  displayName: "Monday",
  //TODO: Kindly download
  logoUrl: "https://www.bynder.com/imager/www_bynder_com/images/sectioncontentlogos/integration-partner-logos/Logo-Integration-Color-monday.com_6d7a5fb4e219d69065fea13cf5f94f6f.png",
  version: packageJson.version,
  authors: ['kanarelo'],
  actions: [mondayCreateAnItem],
  triggers: mondayTriggers,
});

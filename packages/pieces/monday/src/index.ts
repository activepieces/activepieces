import packageJson from "../package.json";

import { createPiece } from "@activepieces/pieces-framework";
import { mondayCreateAnItem } from "./lib/actions/create-item";

import { mondayItemCreatedTrigger } from "./lib/triggers/item-created-trigger";
import { mondayNewUpdatesTrigger } from "./lib/triggers/new-update-trigger";
import { mondayCreateAnUpdate } from "./lib/actions/create-update";

export const monday = createPiece({
  name: "monday",
  displayName: "Monday",
  //TODO: Kindly download
  logoUrl:  "https://www.bynder.com/imager/www_bynder_com/images/sectioncontentlogos/integration-partner-logos/Logo-Integration-Color-monday.com_6d7a5fb4e219d69065fea13cf5f94f6f.png",
  version:  packageJson.version,
  authors:  ['kanarelo'],
  actions:  [mondayCreateAnItem, mondayCreateAnUpdate],
  triggers: [mondayItemCreatedTrigger, mondayNewUpdatesTrigger],
});

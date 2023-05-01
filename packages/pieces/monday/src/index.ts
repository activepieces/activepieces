import packageJson from "../package.json";

import { createPiece, PieceType } from "@activepieces/pieces-framework";
import { mondayCreateAnItem } from "./lib/actions/create-item";

import { mondayItemCreatedTrigger } from "./lib/triggers/item-created-trigger";
import { mondayNewUpdatesTrigger } from "./lib/triggers/new-update-trigger";

export const monday = createPiece({
  name: "monday",
  displayName: "Monday",
  logoUrl: "https://cdn.activepieces.com/pieces/monday.png",
  version: packageJson.version,
  type: PieceType.PUBLIC,
  authors: ['kanarelo'],
  actions: [mondayCreateAnItem],
  triggers: [mondayItemCreatedTrigger, mondayNewUpdatesTrigger],
});

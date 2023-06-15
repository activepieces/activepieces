import { createPiece } from "@activepieces/pieces-framework";
import { mondayCreateAnItem } from "./lib/actions/create-item";

import { mondayItemCreatedTrigger } from "./lib/triggers/item-created-trigger";
import { mondayNewUpdatesTrigger } from "./lib/triggers/new-update-trigger";

export const monday = createPiece({
  displayName: "Monday",
  logoUrl: "https://cdn.activepieces.com/pieces/monday.png",
  authors: ['kanarelo'],
  actions: [mondayCreateAnItem],
  triggers: [mondayItemCreatedTrigger, mondayNewUpdatesTrigger],
});

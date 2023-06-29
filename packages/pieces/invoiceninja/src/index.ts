
import { createPiece } from "@activepieces/pieces-framework";
import { CreateTask } from './lib/actions/create-task';

export const invoiceninja = createPiece({
  displayName: "Invoiceninja",
  logoUrl: "https://cdn.activepieces.com/pieces/invoiceninja.png",
  authors: ["Mark van Bellen, All Tech Plus: mark@all-tech-plus.com"],
  actions: [ CreateTask ],
  triggers: [],
});

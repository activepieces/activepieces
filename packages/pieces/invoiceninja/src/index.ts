
import { createPiece } from "@activepieces/pieces-framework";
import { createTask } from './lib/actions/create-task';

export const invoiceninja = createPiece({
  displayName: "Invoice Ninja",
  logoUrl: "https://cdn.activepieces.com/pieces/invoiceninja.png",
  authors: ["buttonsbond"],
  actions: [createTask],
  triggers: [],
});

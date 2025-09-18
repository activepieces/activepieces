
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { sendQuery } from "./lib/actions/send-query";
import { createFinetune } from "./lib/actions/create-finetune";
import { deleteFinetune } from "./lib/actions/delete-finetune";
import { newLead } from "./lib/triggers/new-lead";

export const sitespeakai = createPiece({
  displayName: "Sitespeakai",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/sitespeakai.png",
  authors: ["Niket2035"],
  actions: [sendQuery, createFinetune, deleteFinetune],
  triggers: [newLead],
});

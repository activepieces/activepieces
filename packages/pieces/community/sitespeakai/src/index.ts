
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { sendQuery } from "./lib/actions/send-query";
import { createFinetune } from "./lib/actions/create-finetune";
import { deleteFinetune } from "./lib/actions/delete-finetune";
import { newLead } from "./lib/triggers/new-lead";
import { SiteSpeakAuth } from "./lib/common/auth";
import { PieceCategory } from "@activepieces/shared";

export const sitespeakai = createPiece({
  displayName: "Sitespeakai",
  description: "Integrate with Sitespeakai to leverage AI-powered chatbots and enhance user interactions on your website.",
  auth: SiteSpeakAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/sitespeakai.png",
  categories:[PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["Niket2035"],
  actions: [sendQuery, createFinetune, deleteFinetune],
  triggers: [newLead],
});

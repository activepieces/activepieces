import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { qwilrAuth } from "./lib/common/auth";
import { createPageAction } from "./lib/actions/create-page";
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { pageAcceptedTrigger } from "./lib/triggers/page-accepted";
import { pagePartiallyAcceptedTrigger } from "./lib/triggers/page-partially-accepted";
import { pagePreviewAcceptedTrigger } from "./lib/triggers/page-preview-accepted";
import { pageViewedTrigger } from "./lib/triggers/page-viewed";
import { pageFirstViewedTrigger } from "./lib/triggers/page-first-viewed";
import { pageSetLiveTrigger } from "./lib/triggers/page-set-live";
import { pageRevivedLiveTrigger } from "./lib/triggers/page-revived-live";

export const qwilr = createPiece({
  displayName: "Qwilr",
  description: "Create beautiful, interactive sales documents and proposals with Qwilr. Automate page creation, track views, and handle acceptance events.",
  auth: qwilrAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/qwilr.png",
  authors: ["onyedikachi-david"],
  categories: [PieceCategory.SALES_AND_CRM, PieceCategory.CONTENT_AND_FILES],
  actions: [
    createPageAction,
    createCustomApiCallAction({
      auth: qwilrAuth,
      baseUrl: () => 'https://api.qwilr.com/v1',
      authMapping: async (auth) => {
        return {
          'Authorization': `Bearer ${auth}`
        }
      }
    })
  ],
  triggers: [
    pageAcceptedTrigger,
    pagePartiallyAcceptedTrigger,
    pagePreviewAcceptedTrigger,
    pageViewedTrigger,
    pageFirstViewedTrigger,
    pageSetLiveTrigger,
    pageRevivedLiveTrigger
  ],
});

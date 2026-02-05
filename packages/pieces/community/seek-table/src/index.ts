
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { seekTableAuth } from "./lib/common/auth";
import { newCsvCubeTrigger } from "./lib/triggers/new-csv-cube.trigger";
import { newReportTrigger } from "./lib/triggers/new-report.trigger";
import { uploadCsvAction } from "./lib/actions/upload-csv.action";
import { shareReportEmailAction } from "./lib/actions/share-report-email.action";

export { seekTableAuth };

export const seekTable = createPiece({
  displayName: "SeekTable",
  description: "Generate and automate reports from SeekTable.",
  auth: seekTableAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/seek-table.png",
  authors: ['onyedikachi-david'],
  actions: [uploadCsvAction, shareReportEmailAction],
  triggers: [newCsvCubeTrigger, newReportTrigger],
});

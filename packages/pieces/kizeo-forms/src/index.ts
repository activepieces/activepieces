
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { getDataDefinition } from "./lib/actions/get-data-definition";
import { pushData } from "./lib/actions/push-data";
import { downloadStandardPDF } from "./lib/actions/download-standard-pdf";
import { eventOnData } from "./lib/trigger/event-on-data.trigger";
import { downloadCustomExportInItsOriginalFormat } from "./lib/actions/download-custom-export-in-its-original-format";
import { eventOnDataDeleted } from "./lib/trigger/event-on-data-deleted";
import { eventOnDataFinished } from "./lib/trigger/event-on-data-finished";
import { eventOnDataPushed } from "./lib/trigger/event-on-data-pushed";
import { eventOnDataPulled } from "./lib/trigger/event-on-data-received";
import { eventOnDataUpdated } from "./lib/trigger/event-on-data-updated";

export const kizeoForms = createPiece({
  displayName: "Kizeo Forms",
  logoUrl: "https://cdn.activepieces.com/pieces/kizeo-forms.png",
  authors: ["BastienMe"],
  actions: [getDataDefinition,pushData,downloadStandardPDF,downloadCustomExportInItsOriginalFormat],
  triggers: [eventOnData, eventOnDataDeleted, eventOnDataFinished, eventOnDataPushed, eventOnDataPulled, eventOnDataUpdated],
});

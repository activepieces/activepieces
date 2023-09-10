
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { getCurrentDate } from "./lib/actions/get-current-date";
import { formatDateAction } from "./lib/actions/format-date";
import { extractDateParts } from "./lib/actions/extract-date-parts";
import { dateDifferenceAction } from "./lib/actions/date-difference";
import { addSubtractDateAction } from "./lib/actions/add-subtract-date";

export const utilityDate = createPiece({
  displayName: "Utility-date",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.8.0',
  logoUrl: "https://cdn.activepieces.com/pieces/utility-date.png",
  authors: ["Salem-Alaa"],
  actions: [ getCurrentDate , formatDateAction , extractDateParts , dateDifferenceAction , addSubtractDateAction ],
  triggers: [],
});

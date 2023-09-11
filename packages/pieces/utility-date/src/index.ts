
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { getCurrentDate } from "./lib/actions/get-current-date";
import { formatDateAction } from "./lib/actions/format-date";
import { extractDateParts } from "./lib/actions/extract-date-parts";
import { dateDifferenceAction } from "./lib/actions/date-difference";
import { addSubtractDateAction } from "./lib/actions/add-subtract-date";

const description =
  `A utility piece to help with date operations and minipulations.`;

export const utilityDate = createPiece({
  displayName: "Date Utility",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.8.0',
  logoUrl: "https://cdn.activepieces.com/pieces/calendar_piece.svg",
  authors: ["Salem-Alaa"],
  actions: [ getCurrentDate , formatDateAction , extractDateParts , dateDifferenceAction , addSubtractDateAction ],
  triggers: [],
  description: description,
});

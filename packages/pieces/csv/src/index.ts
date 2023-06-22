import { createPiece } from "@activepieces/pieces-framework";
import { parseCSVTextAction } from "./lib/actions/convert-json-to-csv";
import { unparseCSVTextAction } from "./lib/actions/convert-csv-to-json";

export const csv = createPiece({
  displayName: "CSV",
  logoUrl: 'https://cdn.activepieces.com/pieces/csv.png',
  actions: [parseCSVTextAction, unparseCSVTextAction],
  authors: ['kanarelo'],
  triggers: [],
});

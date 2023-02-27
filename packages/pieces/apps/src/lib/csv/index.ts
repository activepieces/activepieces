import { createPiece } from "@activepieces/framework";
import { parseCSVTextAction } from "./actions/convert-json-to-csv";
import { unparseCSVTextAction } from "./actions/convert-csv-to-json";

export const csv = createPiece({
  name: 'csv',
  displayName: "CSV",
  logoUrl: 'https://cdn.activepieces.com/pieces/csv.png',
  version: '0.0.0',
  actions: [parseCSVTextAction, unparseCSVTextAction],
  authors: ['kanarelo'],
  triggers: [],
});

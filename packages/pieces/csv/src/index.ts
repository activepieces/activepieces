import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { parseCSVTextAction } from "./lib/actions/convert-json-to-csv";
import { unparseCSVTextAction } from "./lib/actions/convert-csv-to-json";

export const csv = createPiece({
  displayName: "CSV",
  logoUrl: 'https://cdn.activepieces.com/pieces/csv.png',
  auth: PieceAuth.None(),
  actions: [parseCSVTextAction, unparseCSVTextAction],
  authors: ['kanarelo'],
  triggers: [],
});

import { createPiece } from "@activepieces/framework";
import { parseCSVTextAction } from "./actions/parse-csv";
import { unparseCSVTextAction } from "./actions/unparse-csv";

export const csv = createPiece({
  name: 'csv',
  displayName: "CSV",
  //provide logo for CSV
  logoUrl: 'https://forcetalks.s3.amazonaws.com/wp-content/uploads/2018/05/25081331/csv-logo.png',
  version: '0.0.0',
  actions: [parseCSVTextAction, unparseCSVTextAction],
  authors: ['kanarelo'],
  triggers: [],
});

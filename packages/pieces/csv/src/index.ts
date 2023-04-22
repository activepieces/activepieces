import packageJson from "../package.json";
import { createPiece } from "@activepieces/pieces-framework";
import { parseCSVTextAction } from "./lib/actions/convert-json-to-csv";
import { unparseCSVTextAction } from "./lib/actions/convert-csv-to-json";

export const csv = createPiece({
  name: 'csv',
  displayName: "CSV",
  logoUrl: 'https://cdn.activepieces.com/pieces/csv.png',
  version: packageJson.version,
  actions: [parseCSVTextAction, unparseCSVTextAction],
  authors: ['kanarelo'],
  triggers: [],
});

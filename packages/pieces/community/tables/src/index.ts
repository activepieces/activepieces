import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createRecords } from "./lib/actions/create-records";
import { PieceCategory } from "@activepieces/shared";
import { deleteRecord } from "./lib/actions/delete-record";
import { updateRecord } from "./lib/actions/update-record";
import { getRecord } from "./lib/actions/get-record";

export const tables = createPiece({
  displayName: 'Tables',
  logoUrl: 'https://cdn.activepieces.com/pieces/tables.png',
  categories: [PieceCategory.CORE],
  minimumSupportedRelease: '0.36.1',
  authors: ['amrdb'],
  auth: PieceAuth.None(),
  actions: [createRecords, deleteRecord, updateRecord, getRecord],
  triggers: [],
});

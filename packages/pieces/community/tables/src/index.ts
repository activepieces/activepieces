import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { insertRecords } from "./lib/actions/insert-records";
import { PieceCategory } from "@activepieces/shared";
import { deleteRecord } from "./lib/actions/delete-record";

export const tables = createPiece({
  displayName: 'Tables',
  logoUrl: 'https://cdn.activepieces.com/pieces/tables.png',
  categories: [PieceCategory.CORE],
  minimumSupportedRelease: '0.36.1',
  authors: ['amrdb'],
  auth: PieceAuth.None(),
  actions: [insertRecords, deleteRecord],
  triggers: [],
});

import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createRecords } from "./lib/actions/create-records";
import { PieceCategory } from "@activepieces/shared";
import { deleteRecord } from "./lib/actions/delete-record";
import { updateRecord } from "./lib/actions/update-record";
import { getRecord } from "./lib/actions/get-record";
import { findRecords } from "./lib/actions/find-records";
import { newRecordTrigger } from "./lib/triggers/new-record";
import { deletedRecordTrigger } from "./lib/triggers/deleted-record";
import { updatedRecordTrigger } from "./lib/triggers/updated-record";

export const tables = createPiece({
  displayName: 'Tables',
  logoUrl: 'https://cdn.activepieces.com/pieces/tables_piece.svg',
  categories: [PieceCategory.CORE],
  minimumSupportedRelease: '0.54.1',
  authors: ['amrdb'],
  auth: PieceAuth.None(),
  actions: [createRecords, deleteRecord, updateRecord, getRecord, findRecords],
  triggers: [newRecordTrigger, updatedRecordTrigger, deletedRecordTrigger],
});

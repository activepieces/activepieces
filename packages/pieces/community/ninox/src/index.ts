
import { createPiece } from "@activepieces/pieces-framework";
import { NinoxAuth } from "./lib/common/auth";
import { createRecord } from "./lib/actions/create-record";
import { updateRecord } from "./lib/actions/update-record";
import { deleteRecord } from "./lib/actions/delete-record";
import { uploadFile } from "./lib/actions/upload-file";
import { downloadFileFromRecord } from "./lib/actions/download-file-from-record-";
import { findRecord } from "./lib/actions/find-record";
import { listFilesFromRecord } from "./lib/actions/list-files-from-record";
import { newRecord } from "./lib/triggers/new-record";
import { updatedRecord } from "./lib/triggers/updated-record";

export const ninox = createPiece({
  displayName: "Ninox",
  auth: NinoxAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/ninox.png",
  authors: ['Sanket6652'],
  actions: [createRecord, updateRecord, deleteRecord, uploadFile, downloadFileFromRecord, findRecord, listFilesFromRecord],
  triggers: [newRecord, updatedRecord],
});

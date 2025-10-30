import { createPiece } from "@activepieces/pieces-framework";
import { quickbaseAuth } from "./lib/common/auth";
import { newRecord } from "./lib/triggers/new-record";
import { newOrUpdatedRecord } from "./lib/triggers/new-or-updated-record";
import { createRecord } from "./lib/actions/create-record";
import { updateRecord } from "./lib/actions/update-record";
import { createOrUpdateRecordsFromArray } from "./lib/actions/create-or-update-records-from-array";
import { deleteRecord } from "./lib/actions/delete-record";
import { findRecord } from "./lib/actions/find-record";
import { findOrCreateRecord } from "./lib/actions/find-or-update-record";

export const quickbase = createPiece({
  displayName: "Quickbase",
  auth: quickbaseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/quickbase.png",
  authors: [],
  actions: [createRecord, updateRecord, createOrUpdateRecordsFromArray, deleteRecord, findRecord, findOrCreateRecord],
  triggers: [newRecord, newOrUpdatedRecord],
});
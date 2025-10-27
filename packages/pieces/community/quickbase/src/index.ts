import { createPiece } from "@activepieces/pieces-framework";
import { quickbaseAuth } from "./lib/common/auth";
import { newRecord } from "./lib/triggers/new-record";
import { newOrUpdatedRecord } from "./lib/triggers/new-or-updated-record";
import { createRecord } from "./lib/actions/create-record";

export const quickbase = createPiece({
  displayName: "Quickbase",
  auth: quickbaseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/quickbase.png",
  authors: [],
  actions: [createRecord],
  triggers: [newRecord, newOrUpdatedRecord],
});
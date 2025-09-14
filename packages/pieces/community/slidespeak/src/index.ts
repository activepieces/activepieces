import { createPiece } from "@activepieces/pieces-framework";
import { slidespeakAuth } from "./lib/common/auth";

import { generatePresentation } from "./lib/actions/generate-presentation";
import { editPresentation } from "./lib/actions/edit-presentation";
import { getTaskStatus } from "./lib/actions/get-task-status";
import { uploadDocument } from "./lib/actions/upload-document";

import { newPresentation } from "./lib/triggers/new-presentation";
export const slidespeak = createPiece({
  displayName: "Slidespeak",
  auth: slidespeakAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/slidespeak.png",
  authors: [], 
  actions: [
    generatePresentation,
    editPresentation,
    getTaskStatus,
    uploadDocument,
  ],
  triggers: [
    newPresentation,
  ],
});
import { createPiece } from "@activepieces/pieces-framework"
import { paperformAuth } from "./lib/common/auth"
import { newPartialFormSubmission } from './lib/triggers/new-partial-form-submission';
import { newFormSubmission } from './lib/triggers/new-form-submission-';

export const paperform = createPiece({
  displayName: "Paperform",
  auth: paperformAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/paperform.png",
  authors: [],
  actions: [],
  triggers: [newFormSubmission, newPartialFormSubmission],
});
    
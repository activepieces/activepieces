
import { createPiece } from "@activepieces/pieces-framework";
import { formStackAuth } from "./lib/common/auth";

import { createSubmission } from "./lib/actions/create-submission";
import { findFormByNameOrId } from "./lib/actions/find-form-by-name-or-id";
import { getSubmissionDetails } from "./lib/actions/get-submission-details";
import { findSubmissionByFieldValue } from "./lib/actions/find-submission-by-field-value";

import { newSubmission } from "./lib/triggers/new-submission";
import { newForm } from "./lib/triggers/new-form";

export const formstack = createPiece({
  displayName: "Formstack",
  auth: formStackAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/formstack.png",
  authors: ['Sanket6652','onyedikachi-david'],
  actions: [
    createSubmission,
    findFormByNameOrId,
    getSubmissionDetails,
    findSubmissionByFieldValue,
  ],
  triggers: [
    newSubmission,
    newForm,
  ],
});

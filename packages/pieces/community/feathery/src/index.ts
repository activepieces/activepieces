import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { featheryAuth } from "./lib/common/auth";
import { createFormAction } from "./lib/actions/create-form";
import { updateFormAction } from "./lib/actions/update-form";
import { deleteFormAction } from "./lib/actions/delete-form";
import { listFormSubmissionsAction } from "./lib/actions/list-form-submissions";
import { exportSubmissionPdfAction } from "./lib/actions/export-submission-pdf";
import { newSubmissionTrigger } from "./lib/triggers/new-submission";
import { formCompletedTrigger } from "./lib/triggers/form-completed";
import { fileSubmittedTrigger } from "./lib/triggers/file-submitted";

export const feathery = createPiece({
  displayName: "Feathery",
  description: "Build powerful forms, workflows, and document automation.",
  auth: featheryAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/feathery.png",
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  authors: ["onyedikachi-david"],
  actions: [
    createFormAction,
    updateFormAction,
    deleteFormAction,
    listFormSubmissionsAction,
    exportSubmissionPdfAction,
  ],
  triggers: [newSubmissionTrigger, formCompletedTrigger, fileSubmittedTrigger],
});
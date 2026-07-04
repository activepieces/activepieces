
import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { fountainCreateApplicant } from './lib/actions/create-applicant';
import { fountainDeleteApplicant } from './lib/actions/delete-applicant';
import { fountainGetApplicantDetails } from './lib/actions/get-applicant-details';
import { fountainGetInterviewSessions } from './lib/actions/get-interview-sessions';
import { fountainGetOpening } from './lib/actions/get-opening';
import { fountainGetStage } from './lib/actions/get-stage';
import { fountainListApplicants } from './lib/actions/list-applicants';
import { fountainListOpenings } from './lib/actions/list-openings';
import { fountainListStages } from './lib/actions/list-stages';
import { fountainUpdateApplicant } from './lib/actions/update-applicant';
import { fountainApplicantWebhook, fountainWorkerWebhook } from './lib/triggers';
import { fountainCustomAttributeWebhook } from './lib/triggers/custom-attribute-webhook';
import { fountainUniversalTasksWebhook } from './lib/triggers/universal-tasks-webhook';
import { fountainAuth } from './lib/auth';

export const API_BASE_URL_DEFAULT = 'https://api.fountain.com';

export const fountain = createPiece({
  displayName: "Fountain",
  description: "Automate your complete HR hiring and onboarding workflow. Manage applicants, job openings, interview scheduling, and track progress through hiring stages with real-time webhooks.",
  auth: fountainAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/fountain.png",
  authors: ["onyedikachi-david"],
  actions: [fountainCreateApplicant, fountainDeleteApplicant, fountainGetApplicantDetails, fountainGetInterviewSessions, fountainGetOpening, fountainGetStage, fountainListApplicants, fountainListOpenings, fountainListStages, fountainUpdateApplicant],
  triggers: [fountainApplicantWebhook, fountainWorkerWebhook, fountainCustomAttributeWebhook, fountainUniversalTasksWebhook],
});
    
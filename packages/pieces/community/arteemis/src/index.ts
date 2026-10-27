import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { addContactToList } from './lib/actions/add-contact-to-list';
import { addOrMoveContactInPipeline } from './lib/actions/add-or-move-contact-in-pipeline';
import { createOrUpdateContact } from './lib/actions/create-or-update-contact';
import { createTask } from './lib/actions/create-task';
import { enrollContactInCampaign } from './lib/actions/enroll-contact-in-campaign';
import { findContact } from './lib/actions/find-contact';
import { arteemisAuth } from './lib/auth';
import { ARTEEMIS_API_URL } from './lib/common/client';
import { backgroundJobFinished } from './lib/triggers/background-job-finished';
import { contactStatusChanged } from './lib/triggers/contact-status-changed';
import { invitationAccepted } from './lib/triggers/invitation-accepted';
import { leadEnteredCampaign } from './lib/triggers/lead-entered-campaign';
import { leadLeftCampaign } from './lib/triggers/lead-left-campaign';
import { messageSent } from './lib/triggers/message-sent';
import { newReply } from './lib/triggers/new-reply';
import { newTask } from './lib/triggers/new-task';
import { pipelineStageChanged } from './lib/triggers/pipeline-stage-changed';

export const arteemis = createPiece({
  displayName: 'Arteemis',
  description: 'B2B outreach: email and LinkedIn campaigns, a unified inbox, a pipeline and tasks.',
  minimumSupportedRelease: '0.82.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/arteemis.png',
  categories: [PieceCategory.SALES_AND_CRM, PieceCategory.MARKETING],
  auth: arteemisAuth,
  authors: ['romainrabreau'],
  actions: [
    createOrUpdateContact,
    addContactToList,
    enrollContactInCampaign,
    addOrMoveContactInPipeline,
    createTask,
    findContact,
    createCustomApiCallAction({
      auth: arteemisAuth,
      baseUrl: () => ARTEEMIS_API_URL,
      authMapping: async (auth) => ({ Authorization: `Bearer ${auth.secret_text}` }),
    }),
  ],
  triggers: [
    newReply,
    contactStatusChanged,
    leadEnteredCampaign,
    leadLeftCampaign,
    messageSent,
    invitationAccepted,
    newTask,
    pipelineStageChanged,
    backgroundJobFinished,
  ],
});

import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';

import { getCurrentUserAction } from './lib/actions/get-current-user';
import { listEventsAction } from './lib/actions/list-events';
import { getEventAction } from './lib/actions/get-event';
import { cancelEventAction } from './lib/actions/cancel-event';
import { createEventAction } from './lib/actions/create-event';
import { findEventsByEmailAction } from './lib/actions/find-events-by-email';
import { listSchedulingLinksAction } from './lib/actions/list-scheduling-links';
import { getSchedulingLinkAction } from './lib/actions/get-scheduling-link';
import { deleteSchedulingLinkAction } from './lib/actions/delete-scheduling-link';
import { duplicateSchedulingLinkAction } from './lib/actions/duplicate-scheduling-link';
import { toggleSchedulingLinkAction } from './lib/actions/toggle-scheduling-link';
import { getLinkSlotsAction } from './lib/actions/get-link-slots';
import { listWorkflowsAction } from './lib/actions/list-workflows';
import { getWorkflowRulesAction } from './lib/actions/get-workflow-rules';

import { newEventTrigger } from './lib/triggers/new-event';
import { newPollResponseTrigger } from './lib/triggers/new-poll-response';
import { workflowActionTriggeredTrigger } from './lib/triggers/workflow-action-triggered';

import { savvyCalAuth, getToken } from './lib/auth';
import { SAVVYCAL_BASE_URL } from './lib/common';

export const savvyCal = createPiece({
  displayName: 'SavvyCal',
  description: 'Scheduling tool that lets invitees overlay their calendar when picking a time.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/savvycal.png',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: savvyCalAuth,
  authors: ['bst1n','sanket-a11y', 'onyedikachi-david'],
  actions: [
    getCurrentUserAction,
    listEventsAction,
    getEventAction,
    cancelEventAction,
    createEventAction,
    findEventsByEmailAction,
    listSchedulingLinksAction,
    getSchedulingLinkAction,
    deleteSchedulingLinkAction,
    duplicateSchedulingLinkAction,
    toggleSchedulingLinkAction,
    getLinkSlotsAction,
    listWorkflowsAction,
    getWorkflowRulesAction,
    createCustomApiCallAction({
      baseUrl: () => SAVVYCAL_BASE_URL,
      auth: savvyCalAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${getToken(auth)}`,
      }),
    }),
  ],
  triggers: [
    newEventTrigger,
    newPollResponseTrigger,
    workflowActionTriggeredTrigger,
  ],
});

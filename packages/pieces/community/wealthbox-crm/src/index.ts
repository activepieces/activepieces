
    import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
    import { wealthboxCrmAuth } from './lib/common';
    import { createContactAction } from './lib/actions/create-contact';
    import { createNoteAction } from './lib/actions/create-note';
    import { createProjectAction } from './lib/actions/create-project';
    import { createHouseholdAction } from './lib/actions/create-household';
    import { addHouseholdMemberAction } from './lib/actions/add-household-member';
    import { createEventAction } from './lib/actions/create-event';
    import { createOpportunityAction } from './lib/actions/create-opportunity';
    import { createTaskAction } from './lib/actions/create-task';
    import { startWorkflowAction } from './lib/actions/start-workflow';
    import { findContactAction } from './lib/actions/find-contact';
    import { findTaskAction } from './lib/actions/find-task';
    import { newTaskTrigger } from './lib/triggers/new-task';
    import { newContactTrigger } from './lib/triggers/new-contact';
    import { newEventTrigger } from './lib/triggers/new-event';
    import { newOpportunityTrigger } from './lib/triggers/new-opportunity';

    export const wealthboxCrm = createPiece({
      displayName: 'Wealthbox CRM',
      description: 'Wealthbox CRM is a modern, easy-to-use CRM tailored for financial advisors. It supports contacts, notes, tasks, projects, events, opportunities, workflow automations, and household management.',
      auth: wealthboxCrmAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://cdn.activepieces.com/pieces/wealthbox-crm.png',
      authors: ['sparkybug'],
      categories: [PieceCategory.SALES_AND_CRM],
      actions: [
        createContactAction,
        createNoteAction,
        createProjectAction,
        createHouseholdAction,
        addHouseholdMemberAction,
        createEventAction,
        createOpportunityAction,
        createTaskAction,
        startWorkflowAction,
        findContactAction,
        findTaskAction,
      ],
      triggers: [
        newTaskTrigger,
        newContactTrigger,
        newEventTrigger,
        newOpportunityTrigger,
      ],
    });
    
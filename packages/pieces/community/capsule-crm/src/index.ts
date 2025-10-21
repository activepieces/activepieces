
    import { createPiece } from "@activepieces/pieces-framework";
    import { capsuleCrmAuth } from "../src/lib/common/auth";
    import { createContactAction } from "../src/lib/actions/create-contact";
    import { updateContactAction } from "../src/lib/actions/update-contact";
    import { createOpportunityAction } from "../src/lib/actions/create-opportunity";
    import { createProjectAction } from "../src/lib/actions/create-project";
    import { createTaskAction } from "../src/lib/actions/create-task";
    import { updateOpportunityAction } from "../src/lib/actions/update-opportunity";
    import { addNoteToEntityAction } from "../src/lib/actions/add-note-to-entity";
    import { findContactAction } from "../src/lib/actions/find-contact";
    import { findProjectAction } from "../src/lib/actions/find-project";
    import { findOpportunityAction } from "../src/lib/actions/find-opportunity";
    import { newCaseTrigger } from "../src/lib/triggers/new-case";
    import { newOpportunityTrigger } from "../src/lib/triggers/new-opportunity";
    import { newTaskTrigger } from "../src/lib/triggers/new-task";
    import { newProjectTrigger } from "../src/lib/triggers/new-project";

    export const capsuleCrm = createPiece({
      displayName: 'Capsule CRM',
      auth: capsuleCrmAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://cdn.activepieces.com/pieces/capsule-crm.png',
      authors: ['Prabhukiran161', 'onyedikachi-david'],
      actions: [
        createContactAction,
        updateContactAction,
        createOpportunityAction,
        createProjectAction,
        createTaskAction,
        updateOpportunityAction,
        addNoteToEntityAction,
        findContactAction,
        findProjectAction,
        findOpportunityAction,
      ],
      triggers: [
        newCaseTrigger,
        newOpportunityTrigger,
        newTaskTrigger,
        newProjectTrigger,
      ],
    });
    
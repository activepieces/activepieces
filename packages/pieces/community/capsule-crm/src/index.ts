import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { capsuleAuth } from './lib/common/auth';
import { createContact } from './lib/actions/create-contact';
import { updateContact } from './lib/actions/update-contact';
import { createOpportunity } from './lib/actions/create-opportunity';
import { updateOpportunity } from './lib/actions/update-opportunity';
import { createProject } from './lib/actions/create-project';
import { createTask } from './lib/actions/create-task';
import { addNote } from './lib/actions/add-note';
import { findContact } from './lib/actions/find-contact';
import { findProject } from './lib/actions/find-project';
import { findOpportunity } from './lib/actions/find-opportunity';
import { newCases } from './lib/triggers/new-cases';
import { newOpportunities } from './lib/triggers/new-opportunities';
import { newTasks } from './lib/triggers/new-tasks';
import { newProjects } from './lib/triggers/new-projects';

export const capsuleCrm = createPiece({
    displayName: 'Capsule CRM',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/capsule-crm.png',
    categories: [PieceCategory.SALES_AND_CRM, PieceCategory.BUSINESS_INTELLIGENCE],
    authors: ['your-username'],
    auth: capsuleAuth,
    actions: [
        createContact,
        updateContact,
        createOpportunity,
        updateOpportunity,
        createProject,
        createTask,
        addNote,
        findContact,
        findProject,
        findOpportunity,
        createCustomApiCallAction({
            baseUrl: () => 'https://api.capsulecrm.com/api/v2',
            auth: capsuleAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${(auth as any).access_token}`,
            }),
        }),
    ],
    triggers: [newCases, newOpportunities, newTasks, newProjects],
});
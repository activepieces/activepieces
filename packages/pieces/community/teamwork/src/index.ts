import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { teamworkAuth } from './lib/common/auth';

// Import triggers
import { newTask } from './lib/triggers/new-task';
import { newProject } from './lib/triggers/new-project';
import { newComment } from './lib/triggers/new-comment';
import { newPerson } from './lib/triggers/new-person';

// Import actions
import { createTask } from './lib/actions/create-task';
import { createProject } from './lib/actions/create-project';
import { createCompany } from './lib/actions/create-company';
import { createPerson } from './lib/actions/create-person';
import { updateTask } from './lib/actions/update-task';
import { markTaskComplete } from './lib/actions/mark-task-complete';
import { createTaskComment } from './lib/actions/create-task-comment';
import { createTimeEntry } from './lib/actions/create-time-entry';
import { findTask } from './lib/actions/find-task';
import { findCompany } from './lib/actions/find-company';

export const teamwork = createPiece({
    displayName: 'Teamwork',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/teamwork.png',
    categories: [PieceCategory.PRODUCTIVITY, PieceCategory.BUSINESS_INTELLIGENCE],
    authors: ['uvenkatateja'],
    auth: teamworkAuth,
    actions: [
        // Core Actions
        createTask,
        createProject,
        createCompany,
        createPerson,
        updateTask,
        markTaskComplete,
        createTaskComment,
        createTimeEntry,
        
        // Search Actions
        findTask,
        findCompany,
        
        createCustomApiCallAction({
            baseUrl: () => 'https://api.teamwork.com',
            auth: teamworkAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${(auth as any).access_token}`,
            }),
        }),
    ],
    triggers: [
        newTask,
        newProject, 
        newComment,
        newPerson
    ],
});

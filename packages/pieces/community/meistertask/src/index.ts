import { AuthenticationType, createCustomApiCallAction, HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createPiece, OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createAttachment } from './lib/actions/create-attachment'
import { createLabel } from './lib/actions/create-label'
import { createTask } from './lib/actions/create-task'
import { createTaskLabel } from './lib/actions/create-task-label'
import { findAttachment } from './lib/actions/find-attachment'
import { findLabel } from './lib/actions/find-label'
import { findOrCreateAttachment } from './lib/actions/find-or-create-attachment'
import { findOrCreateLabel } from './lib/actions/find-or-create-label'
import { findOrCreateTask } from './lib/actions/find-or-create-task'
import { findPerson } from './lib/actions/find-person'
import { findTask } from './lib/actions/find-task'
import { updateTask } from './lib/actions/update-task'
import { meistertaskAuth } from './lib/auth'
import { MEISTERTASK_API_URL } from './lib/common/common'
import { newAttachment } from './lib/triggers/new-attachment'
import { newChecklistItem } from './lib/triggers/new-checklist-item'
import { newComment } from './lib/triggers/new-comment'
import { newLabel } from './lib/triggers/new-label'
import { newPerson } from './lib/triggers/new-person'
import { newProject } from './lib/triggers/new-project'
import { newSection } from './lib/triggers/new-section'
import { newTask } from './lib/triggers/new-task'
import { newTaskLabel } from './lib/triggers/new-task-label'

export const meistertask = createPiece({
    displayName: 'MeisterTask',
    description: 'Intuitive online task manager for teams, personal productivity, and everything in between.',
    auth: meistertaskAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/meistertask.png',
    categories: [PieceCategory.PRODUCTIVITY],
    authors: ['Ani-4x', 'sanket-a11y'],
    actions: [
        createLabel,
        createTaskLabel,
        createAttachment,
        createTask,
        updateTask,
        findAttachment,
        findLabel,
        findPerson,
        findTask,
        findOrCreateAttachment,
        findOrCreateTask,
        findOrCreateLabel,
        createCustomApiCallAction({
            auth: meistertaskAuth,
            baseUrl: () => MEISTERTASK_API_URL,
            authMapping: async (auth) => {
                return {
                    Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
                }
            },
        }),
    ],
    triggers: [
        newAttachment,
        newPerson,
        newSection,
        newComment,
        newTaskLabel,
        newChecklistItem,
        newProject,
        newLabel,
        newTask,
    ],
})

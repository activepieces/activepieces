import { createCustomApiCallAction, HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createProject } from './lib/actions/create-project'
import { createTask } from './lib/actions/create-task'
import { findTask } from './lib/actions/find-task'
import { getTask } from './lib/actions/get-task'
import { moveTask } from './lib/actions/move-task'
import { updateTask } from './lib/actions/update-task'
import { motionAuth } from './lib/auth'
import { BASE_URL } from './lib/common/props'
import { taskCreated } from './lib/triggers/task-created'

export const motion = createPiece({
    displayName: 'Motion',
    logoUrl: 'https://cdn.activepieces.com/pieces/motion.png',
    categories: [PieceCategory.PRODUCTIVITY],
    auth: motionAuth,
    authors: ['Sanket6652', 'kishanprmr'],
    actions: [
        createTask,
        updateTask,
        createProject,
        getTask,
        moveTask,
        findTask,
        createCustomApiCallAction({
            auth: motionAuth,
            baseUrl: () => BASE_URL,
            authMapping: async (auth) => {
                return {
                    'X-API-Key': auth.secret_text,
                }
            },
        }),
    ],
    triggers: [taskCreated],
})

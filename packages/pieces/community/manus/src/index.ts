import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createTask } from './lib/actions/create-task'
import { deleteTask } from './lib/actions/delete-task'
import { getTask } from './lib/actions/get-task'
import { updateTask } from './lib/actions/update-task'
import { manusAuth } from './lib/common/auth'
import { newTaskCreated } from './lib/triggers/new-task-created'
import { taskStopped } from './lib/triggers/task-stopped'

export const manus = createPiece({
    displayName: 'Manus',
    description: 'AI-powered automation and task execution platform',
    auth: manusAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/manus.png',
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    authors: ['onyedikachi-david'],
    actions: [
        createTask,
        getTask,
        updateTask,
        deleteTask,
        createCustomApiCallAction({
            baseUrl: () => 'https://api.manus.ai/v1',
            auth: manusAuth,
            authMapping: async (auth) => ({
                API_KEY: auth.secret_text,
            }),
        }),
    ],
    triggers: [newTaskCreated, taskStopped],
})

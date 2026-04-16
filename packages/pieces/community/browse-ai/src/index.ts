import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { getTaskDetailsAction } from './lib/actions/get-task-details'
import { listRobotsAction } from './lib/actions/list-robots'
import { runRobotAction } from './lib/actions/run-robot'
import { browseAiAuth } from './lib/common/auth'
import { taskFinishedSuccessfullyTrigger } from './lib/triggers/task-finished-successfully'
import { taskFinishedWithErrorTrigger } from './lib/triggers/task-finished-with-error'

export const browseAi = createPiece({
    displayName: 'Browse AI',
    auth: browseAiAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/browse-ai.png',
    categories: [PieceCategory.PRODUCTIVITY],
    authors: ['aryel780'],
    actions: [
        getTaskDetailsAction,
        listRobotsAction,
        runRobotAction,
        createCustomApiCallAction({
            auth: browseAiAuth,
            baseUrl: () => 'https://api.browse.ai/v2',
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth.secret_text}`,
            }),
        }),
    ],
    triggers: [taskFinishedWithErrorTrigger, taskFinishedSuccessfullyTrigger],
})

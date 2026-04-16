import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { createNote } from './lib/actions/create-note'
import { findProject } from './lib/actions/find-project'
import { findScreen } from './lib/actions/find-screen'
import { updateProject } from './lib/actions/update-project'
import { updateScreen } from './lib/actions/update-screen'
import { ziplinAuth } from './lib/common/auth'
import { BASE_URL } from './lib/common/client'
import { newNote } from './lib/triggers/new-note'
import { newScreen } from './lib/triggers/new-screen'

export const zeplin = createPiece({
    displayName: 'Zeplin',
    auth: ziplinAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/zeplin.png',
    authors: ['sanket-a11y'],
    actions: [
        createNote,
        findProject,
        findScreen,
        updateProject,
        updateScreen,
        createCustomApiCallAction({
            baseUrl: () => BASE_URL,
            auth: ziplinAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth.secret_text}`,
            }),
        }),
    ],
    triggers: [newNote, newScreen],
})

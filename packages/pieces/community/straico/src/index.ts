import { AuthenticationType, createCustomApiCallAction, HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { agentAddRag } from './lib/actions/agent-add-rag'
import { agentCreate } from './lib/actions/agent-create'
import { agentDelete } from './lib/actions/agent-delete'
import { agentGet } from './lib/actions/agent-get'
import { agentList } from './lib/actions/agent-list'
import { agentPromptCompletion } from './lib/actions/agent-prompt-completion'
import { agentUpdate } from './lib/actions/agent-update'
import { fileUpload } from './lib/actions/file-upload'
import { imageGeneration } from './lib/actions/image-generation'
import { promptCompletion } from './lib/actions/prompt-completion'
import { createRag } from './lib/actions/rag-create'
import { deleteRag } from './lib/actions/rag-delete'
import { getRagById } from './lib/actions/rag-get-by-id'
import { listRags } from './lib/actions/rag-list'
import { ragPromptCompletion } from './lib/actions/rag-prompt-completion'
import { updateRag } from './lib/actions/rag-update'
import { straicoAuth } from './lib/auth'
import { baseUrlv1 } from './lib/common/common'

const markdownDescription = `
Follow these instructions to get your Straico API Key:

1. Visit the following website: https://platform.straico.com/user-settings.
2. Once on the website, locate "Connect with Straico API" and click on the copy API Key.
`

export const straico = createPiece({
    displayName: 'Straico',
    auth: straicoAuth,
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/straico.png',
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    description: 'All-in-one generative AI platform',
    authors: ['dennisrongo'],
    actions: [
        promptCompletion,
        imageGeneration,
        fileUpload,
        createRag,
        listRags,
        getRagById,
        updateRag,
        deleteRag,
        ragPromptCompletion,
        agentCreate,
        agentAddRag,
        agentList,
        agentDelete,
        agentUpdate,
        agentGet,
        agentPromptCompletion,
        createCustomApiCallAction({
            auth: straicoAuth,
            baseUrl: () => baseUrlv1,
            authMapping: async (auth) => {
                return {
                    Authorization: `Bearer ${auth.secret_text}`,
                }
            },
        }),
    ],
    triggers: [],
})

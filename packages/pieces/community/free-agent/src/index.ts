import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { freeAgentCreateContact } from './lib/actions/create-contact'
import { freeAgentCreateTask } from './lib/actions/create-task'
import { freeAgentAuth } from './lib/auth'
import { freeAgentNewContactTrigger } from './lib/triggers/new-contact'
import { freeAgentNewInvoiceTrigger } from './lib/triggers/new-invoice'
import { freeAgentNewTaskTrigger } from './lib/triggers/new-task'
import { freeAgentNewUserTrigger } from './lib/triggers/new-user'

export const freeAgent = createPiece({
    displayName: 'FreeAgent',
    description: 'Accounting and invoicing software for small businesses',
    auth: freeAgentAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/free-agent.png',
    authors: ['onyedikachi-david'],
    categories: [PieceCategory.ACCOUNTING],
    actions: [freeAgentCreateTask, freeAgentCreateContact],
    triggers: [
        freeAgentNewInvoiceTrigger,
        freeAgentNewContactTrigger,
        freeAgentNewUserTrigger,
        freeAgentNewTaskTrigger,
    ],
})

import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import {
    addHouseholdMember,
    createContact,
    createEvent,
    createHousehold,
    createNote,
    createOpportunity,
    createProject,
    createTask,
    findContact,
    findTask,
    startWorkflow,
} from './lib/actions'
import { newContact, newEvent, newOpportunity, newTask } from './lib/triggers'

export const wealthboxAuth = PieceAuth.SecretText({
    displayName: 'API Access Token',
    description:
        'Enter your Wealthbox API access token. Get it from Settings → API Access Tokens in your Wealthbox account.',
    required: true,
})
export const wealthbox = createPiece({
    displayName: 'Wealthbox',
    auth: wealthboxAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/wealthbox.png',
    authors: ['fortunamide', 'onyedikachi-david'],
    actions: [
        createContact,
        createNote,
        createProject,
        addHouseholdMember,
        createHousehold,
        createEvent,
        createOpportunity,
        createTask,
        startWorkflow,
        findContact,
        findTask,
    ],
    triggers: [newTask, newContact, newEvent, newOpportunity],
})

import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createCustomProperty } from './lib/actions/create-custom-property'
import { createGoal } from './lib/actions/create-goal'
import { createSharedLink } from './lib/actions/create-shared-link'
import { createSite } from './lib/actions/create-site'
import { deleteCustomProperty } from './lib/actions/delete-custom-property'
import { deleteGoal } from './lib/actions/delete-goal'
import { deleteSite } from './lib/actions/delete-site'
import { getSite } from './lib/actions/get-site'
import { inviteGuest } from './lib/actions/invite-guest'
import { listCustomProperties } from './lib/actions/list-custom-properties'
import { listGoals } from './lib/actions/list-goals'
import { listGuests } from './lib/actions/list-guests'
import { listSites } from './lib/actions/list-sites'
import { listTeams } from './lib/actions/list-teams'
import { removeGuest } from './lib/actions/remove-guest'
import { updateSite } from './lib/actions/update-site'
import { plausibleCommon } from './lib/common'

export const plausibleAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: `To get your API key:
1. Log in to your Plausible Analytics account
2. Click your account name in the top-right menu and go to **Settings**
3. Go to **API Keys** in the left sidebar
4. Click **New API Key**, choose **Sites API**, and save the key`,
    required: true,
    validate: async ({ auth }) => {
        try {
            await httpClient.sendRequest({
                url: `${plausibleCommon.baseUrl}/sites`,
                method: HttpMethod.GET,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: auth,
                },
            })
            return {
                valid: true,
            }
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid API key',
            }
        }
    },
})

export const plausible = createPiece({
    displayName: 'Plausible',
    description: 'Privacy-friendly web analytics',
    auth: plausibleAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/plausible.png',
    authors: ['onyedikachi-david'],
    actions: [
        listTeams,
        listSites,
        getSite,
        createSite,
        updateSite,
        deleteSite,
        createSharedLink,
        listGoals,
        createGoal,
        deleteGoal,
        listCustomProperties,
        createCustomProperty,
        deleteCustomProperty,
        listGuests,
        inviteGuest,
        removeGuest,
    ],
    triggers: [],
    categories: [PieceCategory.MARKETING],
})

import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import {
    addBlockedTimeAction,
    createAppointmentAction,
    createClientAction,
    findAppointmentAction,
    findClientAction,
    rescheduleAppointmentAction,
    updateClientAction,
} from './lib/actions'
import { acuitySchedulingAuth } from './lib/auth'
import { API_URL } from './lib/common'
import { appointmentCanceledTrigger, appointmentScheduledTrigger } from './lib/triggers'

export const acuityScheduling = createPiece({
    displayName: 'Acuity Scheduling',
    logoUrl: 'https://cdn.activepieces.com/pieces/acuity-scheduling.png',
    auth: acuitySchedulingAuth,
    categories: [PieceCategory.PRODUCTIVITY, PieceCategory.SALES_AND_CRM],
    minimumSupportedRelease: '0.36.1',
    authors: ['onyedikachi-david', 'kishanprmr'],
    actions: [
        addBlockedTimeAction,
        createAppointmentAction,
        createClientAction,
        rescheduleAppointmentAction,
        updateClientAction,
        findAppointmentAction,
        findClientAction,
        createCustomApiCallAction({
            auth: acuitySchedulingAuth,
            baseUrl: () => API_URL,
            authMapping: async (auth) => {
                return {
                    Authorization: `Bearer ${auth.access_token}`,
                }
            },
        }),
    ],
    triggers: [appointmentCanceledTrigger, appointmentScheduledTrigger],
})

import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { acknowledgeIncidents } from './lib/actions/acknowledge-incidents'
import { assignIncidents } from './lib/actions/assign-incidents'
import { closeIncidents } from './lib/actions/close-incidents'
import { getIncidentById } from './lib/actions/get-incident-by-id'
import { getIncidentEvents } from './lib/actions/get-incident-events'
import { listIncidents } from './lib/actions/list-incidents'
import { resolveIncidents } from './lib/actions/resolve-incidents'
import { sendLogs } from './lib/actions/send-logs'
import { setAlertActive } from './lib/actions/set-alert-active'
import { coralogixAuth } from './lib/common/auth'
import { newAlertEvent } from './lib/triggers/new-alert-event'
import { newIncident } from './lib/triggers/new-incident'

export const coralogix = createPiece({
    displayName: 'Coralogix',
    auth: coralogixAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/coralogix.png',
    authors: ['sanket-a11y'],
    actions: [
        sendLogs,
        listIncidents,
        acknowledgeIncidents,
        resolveIncidents,
        closeIncidents,
        assignIncidents,
        getIncidentById,
        getIncidentEvents,
        setAlertActive,
        createCustomApiCallAction({
            auth: coralogixAuth,
            baseUrl: (auth) => {
                const map: Record<string, string> = {
                    'eu1.coralogix.com': 'api.coralogix.com',
                    'eu2.coralogix.com': 'api.eu2.coralogix.com',
                    'us1.coralogix.com': 'api.coralogix.us',
                    'us2.coralogix.com': 'api.cx498.coralogix.com',
                    'ap1.coralogix.com': 'api.coralogix.in',
                    'ap2.coralogix.com': 'api.coralogixsg.com',
                    'ap3.coralogix.com': 'api.ap3.coralogix.com',
                }
                const domain = map[auth?.props?.coralogixDomain as string] ?? 'api.coralogix.com'
                return `https://${domain}`
            },
            authMapping: async (auth) => ({
                'Content-Type': 'application/json',
                Authorization: `Bearer ${auth.props.personalOrTeamApiKey}`,
            }),
        }),
    ],
    triggers: [newAlertEvent, newIncident],
})

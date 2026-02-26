import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { coralogixAuth } from './lib/common/auth';
import { sendLogs } from './lib/actions/send-logs';
import { acknowledgeIncidents } from './lib/actions/acknowledge-incidents';
import { getIncidentById } from './lib/actions/get-incident-by-id';
import { getIncidentEvents } from './lib/actions/get-incident-events';
import { getIncidentByEventId } from './lib/actions/get-incident-by-event-id';
import { getAlertDefinitionById } from './lib/actions/get-alert-definition-by-id';
import { getAlertEventsStatistics } from './lib/actions/get-alert-events-statistics';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { newAlertEvent } from './lib/triggers/new-alert-event';

export const coralogix = createPiece({
  displayName: 'Coralogix',
  auth: coralogixAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/coralogix.png',
  authors: ['sanket-a11y'],
  actions: [
    sendLogs,
    acknowledgeIncidents,
    getIncidentById,
    getIncidentEvents,
    getIncidentByEventId,
    getAlertDefinitionById,
    getAlertEventsStatistics,
    createCustomApiCallAction({
      auth: coralogixAuth,
      baseUrl: () => 'https://api.coralogix.com',
      authMapping: async (auth) => {
        return {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.props.personalOrTeamApiKey}`,
        };
      },
    }),
  ],
  triggers: [newAlertEvent],
});

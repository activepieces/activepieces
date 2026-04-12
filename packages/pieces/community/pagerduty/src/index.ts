import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { acknowledgeIncident } from './lib/actions/acknowledge-incident';
import { createIncident } from './lib/actions/create-incident';
import { getIncident } from './lib/actions/get-incident';
import { listIncidents } from './lib/actions/list-incidents';
import { resolveIncident } from './lib/actions/resolve-incident';
import { pagerDutyAuth } from './lib/auth';
import { PAGERDUTY_API_BASE_URL, pagerDutyHeaders } from './lib/common/client';
import { incidentAcknowledged } from './lib/triggers/incident-acknowledged';
import { incidentResolved } from './lib/triggers/incident-resolved';
import { newIncident } from './lib/triggers/new-incident';

export const pagerduty = createPiece({
  displayName: 'PagerDuty',
  description: 'Incident management workflows for PagerDuty REST API v2.',
  auth: pagerDutyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pagerduty.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['Harmatta', 'sanket-a11y'],
  actions: [
    createIncident,
    listIncidents,
    getIncident,
    acknowledgeIncident,
    resolveIncident,
    createCustomApiCallAction({
      auth: pagerDutyAuth,
      baseUrl: () => PAGERDUTY_API_BASE_URL,
      description:
        'Make a custom API call to PagerDuty REST API v2. Authorization, Accept, and Content-Type headers are injected automatically. For write endpoints that require a From header, add it manually in the headers field.',
      authMapping: async (auth) => pagerDutyHeaders(auth.secret_text),
    }),
  ],
  triggers: [newIncident, incidentResolved, incidentAcknowledged],
});

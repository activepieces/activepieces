import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { getEmployeeSystemId } from './lib/actions/get-employee-system-id';
import { getEmployeeInfo } from './lib/actions/get-employee-info';
import { getEmployeeOrganizationalChart } from './lib/actions/get-employee-organizational-chart';
import { getDirectReports } from './lib/actions/get-direct-reports';
import { generateReport } from './lib/actions/generate-report';
import { omnihrAuth } from './lib/auth';

export const omnihr = createPiece({
  displayName: 'Omni HR',
  description:
    'Smart, all-in-one HR platform for managing employees, time tracking, and HR workflows',
  auth: omnihrAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/omnihr.png',
  authors: ['arinmak', 'danielpoonwj'],
  categories: [PieceCategory.HUMAN_RESOURCES],
  actions: [
    getEmployeeSystemId,
    getEmployeeInfo,
    getEmployeeOrganizationalChart,
    getDirectReports,
    generateReport,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.omnihr.co/api/v1/',
      auth: omnihrAuth,
      authMapping: async (auth) => {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
          Origin: auth.props.origin,
        };

        return headers;
      },
    }),
  ],
  triggers: [],
});

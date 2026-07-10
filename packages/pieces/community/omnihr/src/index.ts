import {
  PieceAuth,
  createPiece,
  Property,
} from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { getEmployeeSystemId } from './lib/actions/get-employee-system-id';
import { getEmployeeInfo } from './lib/actions/get-employee-info';
import { getEmployeeOrganizationalChart } from './lib/actions/get-employee-organizational-chart';
import { getDirectReports } from './lib/actions/get-direct-reports';
import { omnihrAuth } from './lib/auth';

const OMNIHR_API_BASE_URL = 'https://api.omnihr.co/api/';
const markdown = 'Enter your OmniHR credentials to authenticate:';

export const omnihr = createPiece({
  displayName: 'Omni HR',
  description:
    'Smart, all-in-one HR platform for managing employees, time tracking, and HR workflows',
  auth: omnihrAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/omnihr.png',
  authors: ['arinmak'],
  categories: [PieceCategory.HUMAN_RESOURCES],
  actions: [
    getEmployeeSystemId,
    getEmployeeInfo,
    getEmployeeOrganizationalChart,
    getDirectReports,
    createCustomApiCallAction({
      // The auth object defined in the piece
      auth: omnihrAuth,
      // The base URL for the API
      baseUrl: () => OMNIHR_API_BASE_URL,
      // Mapping the auth object to the needed authorization headers
      authMapping: async (auth) => {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        };

        if (auth.props.origin) {
          headers['Origin'] = auth.props.origin;
        }

        return headers;
      },
    }),
  ],
  triggers: [],
});

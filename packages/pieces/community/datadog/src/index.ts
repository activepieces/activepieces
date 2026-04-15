import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  constructDatadogBaseHeaders,
  constructDatadogBaseUrl,
} from './lib/common/helpers';
import { sendMultipleLogs } from './lib/actions/send-multiple-logs';
import { sendOneLog } from './lib/actions/send-one-log';
import { PieceCategory } from '@activepieces/shared';
import { datadogAuth } from './lib/common/auth';

export const datadog = createPiece({
  displayName: 'Datadog',
  description: 'Cloud monitoring and analytics platform',
  auth: datadogAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/datadog.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['chaimaa-kadaoui'],
  actions: [
    sendMultipleLogs,
    sendOneLog,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth ? constructDatadogBaseUrl(auth) : ''),
      auth: datadogAuth,
      authMapping: async (auth) => constructDatadogBaseHeaders(auth),
      authLocation: 'headers',
      props: {
        url: {
          description: `You can either use the full URL or the relative path to the base URL
i.e https://api.datadoghq.com/api/v2/resource or /resource.
When using the relative path, the default subdomain is "api" and the default version is "v2".`,
        },
      },
    }),
  ],
  triggers: [],
});

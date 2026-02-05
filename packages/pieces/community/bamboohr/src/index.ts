import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { reportFieldChanged } from './lib/triggers/report-field-changed';
import { bambooHrAuth } from './lib/common/auth';

export const bambooHr = createPiece({
  displayName: 'BambooHR',
  auth: bambooHrAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/bamboohr.png',
  authors: ['AdamSelene'],
  actions: [
    createCustomApiCallAction({
      baseUrl: (auth) =>
        `https://api.bamboohr.com/api/gateway.php/${auth?.props?.companyDomain}/v1/`,
      auth: bambooHrAuth,
      authMapping: async (auth) => {
        const { apiKey } = auth.props;
        return {
          Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString(
            'base64'
          )}`,
        };
      },
    }),
  ],
  triggers: [reportFieldChanged],
});

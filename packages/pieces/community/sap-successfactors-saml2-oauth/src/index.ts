import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { getUser } from './lib/actions/get-user';
import { successFactorsAuth } from './lib/auth';
import { successFactorsHttp } from './lib/common/http';

export const sapSuccessFactorsSaml2Oauth = createPiece({
  displayName: 'SAP SuccessFactors SAML2 OAuth',
  description:
    'SAP SuccessFactors OData V2 integration using the OAuth 2.0 SAML 2.0 Bearer Assertion grant only.',
  logoUrl: 'https://cdn.activepieces.com/pieces/sap-successfactors.png',
  auth: successFactorsAuth,
  minimumSupportedRelease: '0.87.0',
  authors: ['kevinvyang-bit'],
  categories: [PieceCategory.PRODUCTIVITY],
  actions: [
    getUser,
    createCustomApiCallAction({
      auth: successFactorsAuth,
      baseUrl: (auth) => {
        if (!auth) {
          throw new Error('SAP SuccessFactors authentication is required.');
        }

        return `${successFactorsHttp.normalizeBaseUrl({
          value: auth.props.api_url,
          fieldName: 'OData API Base URL',
        })}/odata/v2`;
      },
      authMapping: async (auth, propsValue) => {
        successFactorsHttp.assertCustomApiRelativePath(propsValue['url']);

        const accessToken = successFactorsHttp.requireNonEmpty({
          value: auth.access_token,
          fieldName: 'Access Token',
        });

        return {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        };
      },
    }),
  ],
  triggers: [],
});

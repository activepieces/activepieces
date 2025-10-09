import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece, Property } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { oktaCreateUserAction } from './lib/actions/create-user';
import { oktaActivateUserAction } from './lib/actions/activate-user';
import { oktaDeactivateUserAction } from './lib/actions/deactivate-user';
import { oktaSuspendUserAction } from './lib/actions/suspend-user';
import { oktaUpdateUserAction } from './lib/actions/update-user';
import { oktaAddUserToGroupAction } from './lib/actions/add-user-to-group';
import { oktaRemoveUserFromGroupAction } from './lib/actions/remove-user-from-group';
import { oktaFindUserByEmailAction } from './lib/actions/find-user-by-email';
import { oktaFindGroupByNameAction } from './lib/actions/find-group-by-name';
import { oktaNewEventTrigger } from './lib/triggers/new-event';
import { OktaAuthValue } from './lib/common';



export const oktaAuth = PieceAuth.CustomAuth({
  description: 'Enter your Okta domain and API token',
  required: true,
  props: {
    domain: Property.ShortText({
      displayName: 'Okta Domain',
      description: 'Your Okta domain (e.g., your-domain.okta.com)',
      required: true,
    }),
    apiToken: PieceAuth.SecretText({
      displayName: 'API Token',
      description: 'Your Okta API token',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const response = await fetch(`https://${auth.domain}/api/v1/users/me`, {
        headers: {
          Authorization: `SSWS ${auth.apiToken}`,
          Accept: 'application/json',
        },
      });
      
      if (!response.ok) {
        return {
          valid: false,
          error: 'Invalid Okta domain or API token',
        };
      }
      
      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to connect to Okta. Please check your domain and API token.',
      };
    }
  },
});

export const okta = createPiece({
  displayName: 'Okta',
  description: 'Identity and access management platform',
  auth: oktaAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/okta.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE, PieceCategory.PRODUCTIVITY],
  authors: ['your-github-username'],
  actions: [
    oktaCreateUserAction,
    oktaActivateUserAction,
    oktaDeactivateUserAction,
    oktaSuspendUserAction,
    oktaUpdateUserAction,
    oktaAddUserToGroupAction,
    oktaRemoveUserFromGroupAction,
    oktaFindUserByEmailAction,
    oktaFindGroupByNameAction,
    createCustomApiCallAction({
      baseUrl: (auth) => `https://${(auth as OktaAuthValue).domain}`,
      auth: oktaAuth,
      authMapping: async (auth) => ({
        Authorization: `SSWS ${(auth as OktaAuthValue).apiToken}`,
      }),
    }),
  ],
  triggers: [oktaNewEventTrigger],
});


import {
  createPiece,
  PieceAuth,
  Property
} from '@activepieces/pieces-framework';
import {
  createUser,
  activateUser,
  deactivateUser,
  suspendUser,
  addUserToGroup,
  removeUserFromGroup,
  updateUser,
  findUserByEmail,
  findGroup
} from './lib/actions';
import { newEvent } from './lib/triggers';

export const oktaAuth = PieceAuth.CustomAuth({
  description: 'Enter your Okta domain and API token',
  props: {
    domain: Property.ShortText({
      displayName: 'Okta Domain',
      description: 'Your Okta domain (e.g., subdomain.okta.com)',
      required: true
    }),
    apiToken: Property.ShortText({
      displayName: 'API Token',
      description: 'OAuth 2.0 access token or API token',
      required: true
    })
  },
  required: true
});

export const oktaPiece = createPiece({
  displayName: 'Okta-piece',
  description:
    'The Okta API is a versioned API (e.g., /api/v1/users). Okta reserves the right to add new parameters, properties, or objects without advance notice. Breaking changes are released as new versions. Authentication: Access Okta APIs with OAuth 2.0 access tokens (recommended) or API tokens.',
  auth: oktaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/okta-piece.png',
  authors: [],
  actions: [
    createUser,
    activateUser,
    deactivateUser,
    suspendUser,
    addUserToGroup,
    removeUserFromGroup,
    updateUser,
    findUserByEmail,
    findGroup
  ],
  triggers: [newEvent]
});

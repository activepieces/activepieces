import { PieceAuth } from '@activepieces/pieces-framework';

export const flatAuth = PieceAuth.OAuth2({
  displayName: 'OAuth2 Connection',
  required: true,
  authUrl: 'https://flat.io/auth/oauth',
  tokenUrl: 'https://api.flat.io/oauth/access_token',
  scope: ['account.education_profile', 'account.email', 'account.public_profile', 'collections', 'collections.add_scores', 'collections.readonly', 'edu.admin', 'edu.admin.lti', 'edu.admin.lti.readonly', 'edu.admin.users', 'edu.admin.users.readonly', 'edu.assignments', 'edu.assignments.readonly', 'edu.classes', 'edu.classes.readonly', 'scores', 'scores.readonly', 'scores.social'],
});

export type FlatAuth = typeof flatAuth;

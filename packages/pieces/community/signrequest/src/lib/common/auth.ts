import { PieceAuth } from '@activepieces/pieces-framework';

export const signrequestAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Signrequest API Key',
  required: true,
});

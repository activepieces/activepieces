import { PieceAuth } from '@activepieces/pieces-framework';

export const chatflyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your ChatFly API key',
  required: true,
});

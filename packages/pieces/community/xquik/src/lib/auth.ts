import { PieceAuth } from '@activepieces/pieces-framework';

export const xquikAuth = PieceAuth.SecretText({
  displayName: 'Xquik API Key',
  description:
    'Create an API key in Xquik, then paste it here. API docs: https://docs.xquik.com/api-reference/overview',
  required: true,
});

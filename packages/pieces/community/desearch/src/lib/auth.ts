import { PieceAuth } from '@activepieces/pieces-framework';

export const desearchAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Sign in to your [Desearch account](https://desearch.ai/), open the API key section, and copy your API key into this field.',
  required: true,
});

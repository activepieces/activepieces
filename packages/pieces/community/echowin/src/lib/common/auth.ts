import { PieceAuth } from '@activepieces/pieces-framework';

export const echowinAuth = PieceAuth.SecretText({
  displayName: 'Echowin API Key',
  description: 'API Key for Echowin. Get it from [Echowin Settings](https://echo.win/portal/settings/integrations)',
  required: true,
});

import { PieceAuth } from '@activepieces/pieces-framework';

export const clearoutphoneAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `ClearoutPhone API Key

## Generating an API Token

Once signed up and logged in, click on **Dashboard -> API** tab available on left sidebar and then click on **"Generate API Token"**. 
.`,
  required: true,
});

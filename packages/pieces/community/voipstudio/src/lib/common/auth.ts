import { PieceAuth } from '@activepieces/pieces-framework';

export const voipstudioAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `VoIPstudio API Key

**Web Dashboard - Add API Key**

Follow steps below to add API Key for a user:

1. In Administration panel edit user for whom API Keys needs to be added.
2. Go to API Keys section.
3. Enter a name for your API Key, this can be anything you like. For example a name of your application that will use this API Key.
4. Click "Add" button.
5. Click "Eye" icon to retrieve the actual API Key`,
  required: true,
});

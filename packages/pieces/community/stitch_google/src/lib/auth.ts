import { PieceAuth } from '@activepieces/pieces-framework';

export const stitchGoogleAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Stitch API key. To generate one:\n1. Go to [stitch.withgoogle.com](https://stitch.withgoogle.com/)\n2. Sign in with your Google account\n3. Open Settings → API Keys\n4. Click **Create API Key** and paste it here.',
  required: true,
});

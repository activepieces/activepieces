import { PieceAuth } from '@activepieces/pieces-framework';

export const googleChatAuth = PieceAuth.OAuth2({
  description: 'Authentication for Google Chat API. Make sure to configure the redirect URI as "https://cloud.activepieces.com/api/v1/webhooks/oauth/callback" in your Google Cloud Console.',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: [
    'https://www.googleapis.com/auth/chat.messages',
    'https://www.googleapis.com/auth/chat.spaces',
    'https://www.googleapis.com/auth/chat.messages.readonly',
    'https://www.googleapis.com/auth/chat.spaces.readonly',
  ],
  validate: async ({ auth }) => {
    try {
      // Test the connection by making a simple API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('https://chat.googleapis.com/v1/spaces?pageSize=1', {
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Authentication validation failed: ${response.status} ${errorText}`);
      }

      return { valid: true };
    } catch (error) {
      console.error('Google Chat authentication validation error:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  },
}); 
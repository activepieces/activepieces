import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { uploadPostClient } from './common/client';

export const uploadPostAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
**How to get your Upload-Post API key:**

1. Sign in at [app.upload-post.com](https://app.upload-post.com).
2. Open **API Keys** in the left menu and click **Create API Key**.
3. Copy the key and paste it below.

Before publishing, connect your social accounts to a profile under **Manage Users** in the Upload-Post dashboard.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await uploadPostClient.request<CurrentUserResponse>({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/uploadposts/me',
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid Upload-Post API key. Copy it again from API Keys in your dashboard.',
      };
    }
  },
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const response = await uploadPostClient.request<CurrentUserResponse>({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/uploadposts/me',
      });
      return response.body.email;
    } catch {
      return undefined;
    }
  },
});

type CurrentUserResponse = {
  success: boolean;
  email?: string;
  plan?: string;
};

import { PieceAuth } from '@activepieces/pieces-framework';

const markdown = `
## Quickbase Authentication Setup

### 1. Get Your User Token
- Log in to your Quickbase account
- Go to **My Preferences** → **My User Information**
- Click on **Manage User Tokens**
- Click **New User Token**
- Enter a name for your token and click **Create**
- Copy the generated token (it will only be shown once)

### 2. Required Permissions
Your user token needs access to:
- Read/write permissions for the apps and tables you want to use
- Admin permissions for creating/deleting records (if needed)

**Security Note:** Keep your user token secure - it provides access to your Quickbase data.
`;

export const quickbaseAuth = PieceAuth.SecretText({
  displayName: 'User Token',
  description: markdown,
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await fetch('https://api.quickbase.com/v1/apps', {
        method: 'GET',
        headers: {
          'QB-USER-TOKEN': auth,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        return { valid: true };
      }

      if (response.status === 401) {
        return {
          valid: false,
          error: 'Invalid user token. Please check your token and try again.',
        };
      }

      if (response.status === 403) {
        return {
          valid: false,
          error: 'Access denied. Please ensure your user token has the required permissions.',
        };
      }

      const errorText = await response.text();
      return {
        valid: false,
        error: `HTTP ${response.status}: ${errorText}. Please verify your user token.`,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Failed to validate token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const quickbaseAuth = PieceAuth.CustomAuth({
  description: `
To obtain your Quickbase credentials:

**Step 1: Generate a User Token**
1. Log in to your Quickbase account
2. Click on your **user icon** in the top-right corner
3. Select **"My Preferences"**
4. Under "My User Information", click **"Manage User Tokens"**
5. Click the **"+ New User Token"** button
6. Provide a descriptive name for the token
7. Assign the token to the specific application(s) it will access
8. Click **"Save"** and copy the generated token

**Step 2: Find Your Realm Hostname**
- Your realm hostname is the domain part of your Quickbase URL
- Example: If you access Quickbase at https://example.quickbase.com, your realm hostname is **example.quickbase.com**
- Do NOT include "https://" or any path after the domain

**Note:** Keep your user token secure and create separate tokens for different applications for better security management.
  `,
  required: true,
  props: {
    userToken: PieceAuth.SecretText({
      displayName: 'User Token',
      description: 'Your Quickbase user token for API access',
      required: true,
    }),
    realm: Property.ShortText({
      displayName: 'Realm Hostname',
      description: 'Your Quickbase realm hostname (e.g., example.quickbase.com)',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      // Validate basic format of credentials
      if (!auth.userToken || auth.userToken.trim() === '') {
        return {
          valid: false,
          error: 'User token is required',
        };
      }

      if (!auth.realm || auth.realm.trim() === '') {
        return {
          valid: false,
          error: 'Realm hostname is required',
        };
      }

      // Test the authentication by making a simple API request to list tables
      // Using a minimal query that validates credentials without requiring specific app permissions
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://api.quickbase.com/v1/records/query`,
        headers: {
          'QB-Realm-Hostname': auth.realm,
          Authorization: `QB-USER-TOKEN ${auth.userToken}`,
          'Content-Type': 'application/json',
        },
        body: {
          from: 'invalid_table_id_for_validation',
          select: [3],
        },
      });

      // If we get here without 401/403, credentials are valid
      return {
        valid: true,
      };
    } catch (error: any) {
      const status = error.response?.status;
      const errorBody = error.response?.body;
      
      // 401/403 means authentication failed
      if (status === 401 || status === 403) {
        return {
          valid: false,
          error: 'Invalid user token or realm hostname. Please check your credentials.',
        };
      }
      
      // 404 or other errors related to table not existing are OK - it means auth worked
      if (status === 404 || status === 400) {
        return {
          valid: true,
        };
      }

      // For any other error, provide details
      return {
        valid: false,
        error: `Authentication failed: ${errorBody?.message || error.message || 'Unknown error'}`,
      };
    }
  },
});

export type QuickbaseAuth = {
  userToken: string;
  realm: string;
};


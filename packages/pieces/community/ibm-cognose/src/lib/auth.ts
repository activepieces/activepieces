import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { CognosClient } from './common/cognos-client';

export const ibmCognoseAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
## IBM Cognos Analytics Authentication

Enter your Cognos Analytics credentials:
- **Username**: Your Cognos username
- **Password**: Your Cognos password
  `,
  props: {
    baseurl: Property.ShortText({
      displayName: 'Base URL',
      description: 'Cognos server URL (e.g., https://your-cognos-server.com)',
      required: true
    }),
    CAMNamespace: Property.ShortText({
      displayName: 'CAM Namespace',
      description: 'CAM namespace for authentication (e.g., LDAP)',
      required: true
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Cognos username',
      required: true
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Cognos password',
      required: true
    })
  },
  validate: async ({ auth }) => {
    const { username, password, CAMNamespace, baseurl } = auth;

    if (!username || !password || !CAMNamespace || !baseurl) {
      return {
        valid: false,
        error: 'All fields are required'
      };
    }

    try {
      const client = new CognosClient(auth);
      await client.createSession();
      return {
        valid: true
      };
    } catch (error) {
      return {
        valid: false,
        error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
});

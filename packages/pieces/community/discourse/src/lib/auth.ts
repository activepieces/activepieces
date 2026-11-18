import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { DiscourseApiError, discourseRequest } from './common/client';

export const discourseAuth = PieceAuth.CustomAuth({
  description: `Connect to your Discourse forum with an API key.

1. In Discourse go to **Admin → Advanced → API Keys** (\`https://your-forum.example.com/admin/api/keys\`) and click **New API Key**.
2. Choose **User Level: All Users** and **Scope: Global** (admin, moderation and webhook triggers need a global key created by an admin). A granular key works only for the endpoints you tick.
3. Copy the key, and enter the username the requests should act as (for example \`system\` or your admin username).`,
  required: true,
  props: {
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
    api_username: Property.ShortText({
      displayName: 'API Username',
      description: 'Username the API calls act as, for example system.',
      required: true,
    }),
    website_url: Property.ShortText({
      displayName: 'Website URL',
      description:
        'Base URL of your forum, for example https://forum.example.com or https://example.com/forum for a subfolder install. Must use https.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await discourseRequest({
        auth,
        method: HttpMethod.GET,
        path: '/session/current.json',
      });
      return { valid: true };
    } catch (error) {
      if (error instanceof DiscourseApiError) {
        if (error.status === 401 || error.status === 403) {
          return { valid: false, error: 'Invalid API Key or API Username.' };
        }
        if (error.status === 404) {
          return {
            valid: false,
            error:
              'Discourse did not recognise the API Username, or the Website URL does not point to a Discourse forum.',
          };
        }
      }
      const reason = error instanceof Error ? error.message : String(error);
      return { valid: false, error: `Could not verify the connection: ${reason}` };
    }
  },
});

import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const slackOAuth2Auth = PieceAuth.OAuth2({
  description:
    'Authenticate via a Slack OAuth flow.',
  authUrl:
    'https://slack.com/oauth/v2/authorize?user_scope=search:read,users.profile:write,reactions:read,reactions:write,im:history,stars:read,channels:write,groups:write,im:write,mpim:write,channels:write.invites,groups:write.invites,channels:history,groups:history,chat:write,users:read',
  tokenUrl: 'https://slack.com/api/oauth.v2.access',
  required: true,
  scope: [
    'channels:read',
    'channels:manage',
    'channels:history',
    'chat:write',
    'groups:read',
    'groups:write',
    'groups:history',
    'reactions:read',
    'mpim:read',
    'mpim:write',
    'mpim:history',
    'im:write',
    'im:read',
    'im:history',
    'users:read',
    'files:write',
    'files:read',
    'users:read.email',
    'reactions:write',
    'usergroups:read',
    'chat:write.customize',
    'links:read',
    'links:write',
    'emoji:read',
    'users.profile:read',
    'channels:write.invites',
    'groups:write.invites',
    'channels:join',
    'conversations.connect:write'
  ],
});

const slackCustomAuth = PieceAuth.CustomAuth({
  displayName: 'Bot Token',
  description: 'Authenticate using a Slack bot token (and optional user token).',
  required: true,
  props: {
    botToken: PieceAuth.SecretText({
      displayName: 'Bot Token',
      description: 'The bot token for your Slack app (starts with xoxb-)',
      required: true,
    }),
    userToken: PieceAuth.SecretText({
      displayName: 'User Token',
      description: 'Optional user token for actions that require user-level access (starts with xoxp-)',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest<{ ok: boolean; error?: string }>({
        method: HttpMethod.GET,
        url: 'https://slack.com/api/auth.test',
        headers: {
          Authorization: `Bearer ${auth.botToken}`,
        },
      });
      if (!response.body.ok) {
        return {
          valid: false,
          error: `Slack auth test failed: ${response.body.error}`,
        };
      }
      return { valid: true };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  },
});

export const slackAuth = [slackOAuth2Auth, slackCustomAuth];

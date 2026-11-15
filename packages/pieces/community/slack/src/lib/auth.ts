import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const nameOf = (value: unknown): string | undefined => {
  if (typeof value === 'object' && value !== null && 'name' in value && typeof value.name === 'string' && value.name.length > 0) {
    return value.name;
  }
  return undefined;
};

export const slackOAuth2Auth = PieceAuth.OAuth2({
  description:
    'Authenticate via a Slack OAuth flow.',
  authUrl:
    'https://slack.com/oauth/v2/authorize?user_scope=search:read,users.profile:write,reactions:read,reactions:write,im:history,stars:read,channels:write,groups:write,im:write,mpim:write,channels:write.invites,groups:write.invites,channels:history,groups:history,chat:write,users:read,usergroups:write',
  tokenUrl: 'https://slack.com/api/oauth.v2.access',
  required: true,
  // Slack connects a workspace, not an email account, so show "<user> (<workspace>)":
  // the workspace comes from team.name in the token response, the authorizing user's
  // display name from users.info. Best-effort — falls back to the workspace alone.
  getConnectionIdentifier: async ({ auth }) => {
    const workspace = nameOf(auth.data['team']) ?? nameOf(auth.data['enterprise']);
    if (!workspace) {
      return undefined;
    }
    const userId = (auth.data['authed_user'] as { id?: string } | undefined)?.id;
    if (!userId) {
      return workspace;
    }
    try {
      const response = await httpClient.sendRequest<{
        ok: boolean;
        user?: { name?: string; real_name?: string; profile?: { display_name?: string } };
      }>({
        method: HttpMethod.GET,
        url: 'https://slack.com/api/users.info',
        queryParams: { user: userId },
        headers: { Authorization: `Bearer ${auth.access_token}` },
        timeout: 5000,
      });
      const user = response.body.user;
      const name = user?.profile?.display_name || user?.real_name || user?.name;
      return name ? `${name} (${workspace})` : workspace;
    } catch {
      return workspace;
    }
  },
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
    'usergroups:write',
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

import { AppConnectionType } from '@activepieces/shared';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import type { slackAuth } from '../../index';

export type SlackAuthValue = AppConnectionValueForAuthProperty<
  typeof slackAuth
>;

type SlackOAuth2Auth = {
  type:
    | AppConnectionType.OAUTH2
    | AppConnectionType.CLOUD_OAUTH2
    | AppConnectionType.PLATFORM_OAUTH2;
  access_token: string;
  data: Record<string, unknown>;
};

type SlackCustomAuth = {
  type: AppConnectionType.CUSTOM_AUTH;
  props: {
    botToken: string;
    userToken?: string;
  };
};

type SlackAuth = SlackOAuth2Auth | SlackCustomAuth;

function isCustomAuth(auth: SlackAuth): auth is SlackCustomAuth {
  return auth.type === AppConnectionType.CUSTOM_AUTH;
}

export function getBotToken(auth: SlackAuthValue): string {
  const a = auth as SlackAuth;
  if (isCustomAuth(a)) {
    return a.props.botToken;
  }
  return a.access_token;
}

export function getUserToken(auth: SlackAuthValue): string | undefined {
  const a = auth as SlackAuth;
  if (isCustomAuth(a)) {
    return a.props.userToken || undefined;
  }
  return (a.data?.['authed_user'] as Record<string, string> | undefined)
    ?.access_token;
}

export function requireUserToken(auth: SlackAuthValue): string {
  const token = getUserToken(auth);
  if (!token) {
    throw new Error(
      JSON.stringify({
        message: 'Missing user token, please re-authenticate',
      })
    );
  }
  return token;
}

export async function getTeamId(auth: SlackAuthValue): Promise<string> {
  const a = auth as SlackAuth;
  if (!isCustomAuth(a)) {
    return (
      (a.data['team_id'] as string) ??
      (a.data['team'] as Record<string, string>)['id']
    );
  }
  const response = await httpClient.sendRequest<{
    ok: boolean;
    team_id: string;
  }>({
    method: HttpMethod.GET,
    url: 'https://slack.com/api/auth.test',
    headers: {
      Authorization: `Bearer ${a.props.botToken}`,
    },
  });
  if (!response.body.ok) {
    throw new Error('Failed to get team ID from Slack auth.test');
  }
  return response.body.team_id;
}

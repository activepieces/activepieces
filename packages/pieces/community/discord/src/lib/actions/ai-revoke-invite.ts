import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordRevokeInvite = createAction({
  auth: discordAuth,
  name: 'discord_revoke_invite',
  displayName: 'Revoke Invite',
  description: 'Delete (revoke) an invite by its code.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Revokes an invite by its code (DELETE /invites/{invite_code}). Obtain codes from List Invites. Revoking a live invite is a state change, so this is not idempotent (a missing invite returns success, but the meaningful effect happens once). Requires Manage Channels or Manage Guild permission.',
    idempotent: false,
  },
  props: {
    invite_code: Property.ShortText({
      displayName: 'Invite Code',
      description:
        'The invite code (the part after discord.gg/, e.g. "aBcDeF"). Obtain from List Invites.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.DELETE,
      url: `https://discord.com/api/v9/invites/${configValue.propsValue.invite_code}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const res = await httpClient.sendRequest<any>(request);
      return { success: res.status === 200, code: res.body?.code };
    } catch (error: any) {
      const status = error?.response?.status;
      // 404 -> invite already gone; report it without throwing.
      if (status === 404) {
        return { success: true, alreadyAbsent: true };
      }
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks Manage Channels / Manage Guild permission.'
        );
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});

import { createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { lobstermailCommon } from '../common';
import { lobstermailAuth } from '../..';

export const listInboxes = createAction({
  auth: lobstermailAuth,
  name: 'list_inboxes',
  displayName: 'List Inboxes',
  description: 'List all email inboxes on the account.',
  audience: 'both',
  aiMetadata: { description: 'Returns every email inbox on the authenticated LobsterMail account, each with its id and address. Use to discover which inboxes exist or to find an inbox id needed by other actions. Takes no input. Read-only and idempotent.', idempotent: true },
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest<{
      data: {
        id: string;
        address: string;
        localPart: string;
        domain: string;
        displayName?: string;
        active: boolean;
        createdAt: string;
      }[];
    }>({
      method: HttpMethod.GET,
      url: `${lobstermailCommon.baseUrl}/v1/inboxes`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });

    return (response.body.data ?? []).map((inbox) => ({
      id: inbox.id,
      address: inbox.address,
      local_part: inbox.localPart,
      domain: inbox.domain,
      display_name: inbox.displayName ?? null,
      active: inbox.active,
      created_at: inbox.createdAt,
    }));
  },
});

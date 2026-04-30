import { createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { lobstermailCommon, inboxIdDropdown } from '../common';
import { lobstermailAuth } from '../..';

export const getInbox = createAction({
  auth: lobstermailAuth,
  name: 'get_inbox',
  displayName: 'Get Inbox',
  description: 'Get details for a single inbox including its address, status, and settings.',
  props: {
    inbox_id: inboxIdDropdown,
  },
  async run(context) {
    const response = await httpClient.sendRequest<{
      id: string;
      address: string;
      localPart: string;
      domain: string;
      displayName?: string;
      active: boolean;
      autoExtract?: boolean;
      createdAt: string;
    }>({
      method: HttpMethod.GET,
      url: `${lobstermailCommon.baseUrl}/v1/inboxes/${context.propsValue.inbox_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });

    const inbox = response.body;
    return {
      id: inbox.id,
      address: inbox.address,
      local_part: inbox.localPart,
      domain: inbox.domain,
      display_name: inbox.displayName ?? null,
      active: inbox.active,
      auto_extract: inbox.autoExtract ?? null,
      created_at: inbox.createdAt,
    };
  },
});

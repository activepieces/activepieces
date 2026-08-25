import { createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { lobstermailCommon, inboxIdDropdown } from '../common';
import { lobstermailAuth } from '../..';

export const deleteInbox = createAction({
  auth: lobstermailAuth,
  name: 'delete_inbox',
  displayName: 'Delete Inbox',
  description: 'Permanently delete an inbox and release its address. This action cannot be undone.',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a LobsterMail inbox by its id and frees its address; this is destructive and cannot be undone. Use only when an agent is certain the inbox and its mail are no longer needed. Requires a known inbox id. Not idempotent — a repeat call against an already-deleted inbox will fail rather than succeed silently.', idempotent: false },
  props: {
    inbox_id: inboxIdDropdown,
  },
  async run(context) {
    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${lobstermailCommon.baseUrl}/v1/inboxes/${context.propsValue.inbox_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });

    return { success: true, deleted_inbox_id: context.propsValue.inbox_id };
  },
});

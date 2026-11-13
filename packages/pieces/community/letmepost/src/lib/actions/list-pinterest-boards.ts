import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { letmepostAuth } from '../common/auth';
import { letmepostCommon } from '../common';
import { letmepostClient } from '../common/client';
import { listPinterestBoardsOutputSchema } from '../common/output-schemas';

export const listPinterestBoards = createAction({
  auth: letmepostAuth,
  name: 'list_pinterest_boards',
  classification: 'SEARCH',
  displayName: 'List Pinterest Boards',
  description: 'List the boards of a connected Pinterest account',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the boards of one connected Pinterest account, with each board id, name and privacy, plus the account default board id. Use to pick the Pinterest board id for Publish or Schedule a Post. Only works on Pinterest accounts. Idempotent, a read-only lookup.',
    idempotent: true,
  },
  props: {
    accountId: letmepostCommon.accountDropdown({
      displayName: 'Pinterest account',
      description: 'The connected Pinterest account. You can also map an account id from List Accounts.',
      platforms: ['pinterest'],
    }),
  },
  outputSchema: listPinterestBoardsOutputSchema,
  async run(context) {
    return letmepostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/v1/accounts/${letmepostClient.segment({ value: context.propsValue.accountId, label: 'Pinterest account' })}/pinterest/boards`,
      operation: 'list the Pinterest boards',
    });
  },
});

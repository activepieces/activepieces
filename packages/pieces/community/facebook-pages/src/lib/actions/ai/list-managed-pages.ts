import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../../auth';
import { facebookPagesCommon, GraphList, GraphRecord } from '../../common/common';
import { listManagedPagesOutputSchema } from '../../output-schemas';

export const listManagedPagesAction = createAction({
  auth: facebookPagesAuth,
  name: 'list_managed_pages',
  classification: 'SEARCH',
  displayName: 'List Managed Pages',
  description: 'Lists the Facebook Pages the connected account manages.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the Facebook Pages the connected account has a role on, with each Page ID, name, category, username, link and the tasks the account can perform on it. The starting point for every other Facebook Pages action, which all need a Page ID. Paginated with After Cursor. Read-only.',
    idempotent: true,
  },
  outputSchema: listManagedPagesOutputSchema,
  props: {
    limit: facebookPagesCommon.limit,
    after: facebookPagesCommon.after,
  },
  async run({ auth, propsValue }) {
    const response = await facebookPagesCommon.graphRequest<GraphList<GraphRecord>>({
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      path: 'me/accounts',
      queryParams: {
        fields: 'id,name,category,username,link,tasks',
        ...facebookPagesCommon.cursorQuery({ limit: propsValue.limit, after: propsValue.after }),
      },
    });
    return facebookPagesCommon.toCursorPage({ response });
  },
});

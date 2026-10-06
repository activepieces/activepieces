import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformPage, TypeformRecord } from '../common';
import { workspacesOutputSchema } from '../output-schemas';

export const listWorkspacesAction = createAction({
  auth: typeformAuth,
  name: 'list_workspaces',
  classification: 'SEARCH',
  displayName: 'List Workspaces',
  description: 'Lists workspaces in the Typeform account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List Typeform workspaces with each ID, name, account ID, whether it is the default or shared workspace, and its form count. This is where the account ID for Create Workspace comes from. Filter by name, or by Account ID to list one account. Paginated with Page and Page Size (up to 200). Read-only.',
    idempotent: true,
  },
  outputSchema: workspacesOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only workspaces whose name contains this text.',
      required: false,
    }),
    accountId: Property.ShortText({
      displayName: 'Account ID',
      description: 'Only workspaces of this account (account_id from a workspace).',
      required: false,
    }),
    page: typeformCommon.page,
    pageSize: typeformCommon.pageSize,
  },
  async run({ auth, propsValue }) {
    const { search, accountId, page, pageSize } = propsValue;
    return typeformCommon.typeformRequest<TypeformPage<TypeformRecord>>({
      token: auth.access_token,
      method: HttpMethod.GET,
      path: typeformCommon.isProvided(accountId)
        ? `/accounts/${encodeURIComponent(accountId.trim())}/workspaces`
        : '/workspaces',
      queryParams: {
        search: search?.trim(),
        ...typeformCommon.pageQuery({ page, pageSize, maxPageSize: typeformCommon.maxPageSize }),
      },
    });
  },
});

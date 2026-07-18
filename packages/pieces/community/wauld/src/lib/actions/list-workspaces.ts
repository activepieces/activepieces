import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { wauldAuth } from '../auth';

const WAULD_BASE_URL = 'https://wauld.app';

type WauldWorkspace = {
  id: string;
  parent?: string;
  name: string;
  description?: string;
  logo?: string;
  archived?: boolean;
};

type ListWorkspacesResponse = {
  workspaces?: WauldWorkspace[];
  nextPageToken?: string;
};

export const listWorkspaces = createAction({
  name: 'list_workspaces',
  auth: wauldAuth,
  displayName: 'List Workspaces',
  description: 'Lists the workspaces available in your Wauld account.',
  props: {},
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the workspaces available under the connected Wauld account.',
    idempotent: true,
  },
  async run(context) {
    const response =
      await httpClient.sendRequest<ListWorkspacesResponse>({
        method: HttpMethod.POST,
        url: `${WAULD_BASE_URL}/wauld.WorkspaceService/ListWorkspaces`,
        headers: {
          Authorization: `Bearer ${context.auth.props.accessToken}`,
          'Connect-Protocol-Version': '1',
          'Content-Type': 'application/json',
        },
        body: {
          parent: context.auth.props.accountId,
          pageSize: 25,
        },
      });

    return response.body.workspaces ?? [];
  },
});
import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { wauldAuth } from '../auth';

const WAULD_BASE_URL = 'https://wauld.app';

type WauldWorkspace = {
  id: string;
  name: string;
  parent?: string;
  description?: string;
  archived?: boolean;
};

type ListWorkspacesResponse = {
  workspaces?: WauldWorkspace[];
  nextPageToken?: string;
};

type WauldEngagement = {
  id: string;
  parent?: string;
  name: string;
  type?: string;
  description?: string;
  createTime?: string;
  updateTime?: string;
};

type ListEngagementsResponse = {
  engagements?: WauldEngagement[];
  nextPageToken?: string;
};

async function fetchWorkspaces(
  accessToken: string,
  accountId: string,
): Promise<WauldWorkspace[]> {
  const workspaces: WauldWorkspace[] = [];
  let pageToken: string | undefined;

  do {
    const response =
      await httpClient.sendRequest<ListWorkspacesResponse>({
        method: HttpMethod.POST,
        url: `${WAULD_BASE_URL}/wauld.WorkspaceService/ListWorkspaces`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Connect-Protocol-Version': '1',
          'Content-Type': 'application/json',
        },
        body: {
          parent: accountId,
          pageSize: 25,
          ...(pageToken ? { pageToken } : {}),
        },
      });

    workspaces.push(...(response.body.workspaces ?? []));
    pageToken = response.body.nextPageToken;
  } while (pageToken);

  return workspaces;
}

export const listEngagements = createAction({
  name: 'list_engagements',
  auth: wauldAuth,
  displayName: 'List Engagements',
  description:
    'Lists all engagements available in a selected Wauld workspace.',
  props: {
    workspaceId: Property.Dropdown<
      string,
      true,
      typeof wauldAuth
    >({
      auth: wauldAuth,
      displayName: 'Workspace',
      description:
        'Select the workspace whose engagements you want to list.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your Wauld account first',
          };
        }

        try {
          const workspaces = await fetchWorkspaces(
            auth.props.accessToken,
            auth.props.accountId,
          );

          return {
            disabled: false,
            options: workspaces.map((workspace) => ({
              label: workspace.name,
              value: workspace.id,
            })),
          };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder:
              'Unable to load workspaces. Check your Wauld connection.',
          };
        }
      },
    }),
  },
  audience: 'both',
  aiMetadata: {
    description:
      'Returns all engagements contained in a selected Wauld workspace.',
    idempotent: true,
  },
  async run(context) {
    const engagements: WauldEngagement[] = [];
    let pageToken: string | undefined;

    do {
      const response =
        await httpClient.sendRequest<ListEngagementsResponse>({
          method: HttpMethod.POST,
          url: `${WAULD_BASE_URL}/wauld.EngagementService/ListEngagements`,
          headers: {
            Authorization:
              `Bearer ${context.auth.props.accessToken}`,
            'Connect-Protocol-Version': '1',
            'Content-Type': 'application/json',
          },
          body: {
            parent: context.propsValue.workspaceId,
            pageSize: 10,
            ...(pageToken ? { pageToken } : {}),
          },
        });

      engagements.push(...(response.body.engagements ?? []));
      pageToken = response.body.nextPageToken;
    } while (pageToken);

    return engagements;
  },
});
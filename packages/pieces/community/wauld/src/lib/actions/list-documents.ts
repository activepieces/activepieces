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
};

type WauldEngagement = {
  id: string;
  name: string;
  parent?: string;
};

type WauldDocument = {
  id: string;
  parent?: string;
  name: string;
  type?: string;
  customAttributes?: string[];
  recipientType?: string;
  createTime?: string;
  updateTime?: string;
  designTemplate?: string;
  skills?: string[];
  imageAttributes?: string[];
};

type ListWorkspacesResponse = {
  workspaces?: WauldWorkspace[];
  nextPageToken?: string;
};

type ListEngagementsResponse = {
  engagements?: WauldEngagement[];
  nextPageToken?: string;
};

type ListDocumentsResponse = {
  documents?: WauldDocument[];
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

async function fetchEngagements(
  accessToken: string,
  workspaceId: string,
): Promise<WauldEngagement[]> {
  const engagements: WauldEngagement[] = [];
  let pageToken: string | undefined;

  do {
    const response =
      await httpClient.sendRequest<ListEngagementsResponse>({
        method: HttpMethod.POST,
        url: `${WAULD_BASE_URL}/wauld.EngagementService/ListEngagements`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Connect-Protocol-Version': '1',
          'Content-Type': 'application/json',
        },
        body: {
          parent: workspaceId,
          pageSize: 10,
          ...(pageToken ? { pageToken } : {}),
        },
      });

    engagements.push(...(response.body.engagements ?? []));
    pageToken = response.body.nextPageToken;
  } while (pageToken);

  return engagements;
}

export const listDocuments = createAction({
  name: 'list_documents',
  auth: wauldAuth,
  displayName: 'List Documents',
  description:
    'Lists all credential documents available in a selected Wauld engagement.',
  props: {
    workspaceId: Property.Dropdown<
      string,
      true,
      typeof wauldAuth
    >({
      auth: wauldAuth,
      displayName: 'Workspace',
      description: 'Select the Wauld workspace.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your Wauld account first',
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
            placeholder: 'Unable to load workspaces',
          };
        }
      },
    }),

    engagementId: Property.Dropdown({
      displayName: 'Engagement',
      description:
        'Select the engagement whose documents you want to list.',
      required: true,
      auth: wauldAuth,
      refreshers: ['workspaceId'],
      options: async ({ auth, workspaceId }) => {
        if (!auth || !workspaceId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Select a workspace first',
          };
        }

        try {
          const engagements = await fetchEngagements(
            auth.props.accessToken,
            workspaceId as string,
          );

          return {
            disabled: false,
            options: engagements.map((engagement) => ({
              label: engagement.name,
              value: engagement.id,
            })),
          };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder: 'Unable to load engagements',
          };
        }
      },
    }),
  },
  audience: 'both',
  aiMetadata: {
    description:
      'Returns all credential documents contained in a selected Wauld engagement.',
    idempotent: true,
  },
  async run(context) {
    const documents: WauldDocument[] = [];
    let pageToken: string | undefined;

    do {
      const response =
        await httpClient.sendRequest<ListDocumentsResponse>({
          method: HttpMethod.POST,
          url: `${WAULD_BASE_URL}/wauld.DocumentService/ListDocuments`,
          headers: {
            Authorization:
              `Bearer ${context.auth.props.accessToken}`,
            'Connect-Protocol-Version': '1',
            'Content-Type': 'application/json',
          },
          body: {
            parent: context.propsValue.engagementId,
            pageSize: 10,
            ...(pageToken ? { pageToken } : {}),
          },
        });

      documents.push(...(response.body.documents ?? []));
      pageToken = response.body.nextPageToken;
    } while (pageToken);

    return documents;
  },
});
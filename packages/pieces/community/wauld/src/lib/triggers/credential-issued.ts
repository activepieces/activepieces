import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { wauldAuth } from '../auth';

const WAULD_BASE_URL = 'https://wauld.app';
const WEBHOOK_STORE_KEY =
  'wauld_credential_issued_webhook';

type WauldWorkspace = {
  id: string;
  name: string;
};

type WauldEngagement = {
  id: string;
  name: string;
};

type WauldDocument = {
  id: string;
  name: string;
};

type WauldCredential = {
  id: string;
  parent?: string;
  published?: boolean;
  document?: {
    name?: string;
    engagementName?: string;
    type?: string;
    skills?: string[];
  };
  recipient?: {
    name?: string;
    email?: string;
  };
  attributes?: Array<{
    name?: string;
    value?: string;
  }>;
  expireTime?: string;
  publishTime?: string;
  viewCount?: number | string;
  sharable?: boolean;
  linkedIn?: boolean;
  void?: boolean;
  accessRevoked?: boolean;
  verifyCount?: number | string;
  downloadCount?: number | string;
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

type ListCredentialsResponse = {
  credentials?: WauldCredential[];
  nextPageToken?: string;
};

type StoredWebhook = {
  id: string;
};

type CreateWebhookResponse = {
  id?: string;
  webhook?: {
    id?: string;
  };
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
        url:
          `${WAULD_BASE_URL}` +
          '/wauld.WorkspaceService/ListWorkspaces',
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

    workspaces.push(
      ...(response.body.workspaces ?? []),
    );

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
        url:
          `${WAULD_BASE_URL}` +
          '/wauld.EngagementService/ListEngagements',
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

    engagements.push(
      ...(response.body.engagements ?? []),
    );

    pageToken = response.body.nextPageToken;
  } while (pageToken);

  return engagements;
}

async function fetchDocuments(
  accessToken: string,
  engagementId: string,
): Promise<WauldDocument[]> {
  const documents: WauldDocument[] = [];
  let pageToken: string | undefined;

  do {
    const response =
      await httpClient.sendRequest<ListDocumentsResponse>({
        method: HttpMethod.POST,
        url:
          `${WAULD_BASE_URL}` +
          '/wauld.DocumentService/ListDocuments',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Connect-Protocol-Version': '1',
          'Content-Type': 'application/json',
        },
        body: {
          parent: engagementId,
          pageSize: 10,
          ...(pageToken ? { pageToken } : {}),
        },
      });

    documents.push(
      ...(response.body.documents ?? []),
    );

    pageToken = response.body.nextPageToken;
  } while (pageToken);

  return documents;
}

export const credentialIssued = createTrigger({
  name: 'credential_issued',
  auth: wauldAuth,
  displayName: 'Credential Issued',
  description:
    'Triggers when a credential is issued using the selected Wauld document.',

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
            placeholder:
              'Connect your Wauld account first',
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
              'Unable to load workspaces',
          };
        }
      },
    }),

    engagementId: Property.Dropdown({
      auth: wauldAuth,
      displayName: 'Engagement',
      description: 'Select the Wauld engagement.',
      required: true,
      refreshers: ['workspaceId'],
      options: async ({ auth, workspaceId }) => {
        if (!auth || !workspaceId) {
          return {
            disabled: true,
            options: [],
            placeholder:
              'Select a workspace first',
          };
        }

        try {
          const engagements = await fetchEngagements(
            auth.props.accessToken,
            workspaceId as string,
          );

          return {
            disabled: false,
            options: engagements.map(
              (engagement) => ({
                label: engagement.name,
                value: engagement.id,
              }),
            ),
          };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder:
              'Unable to load engagements',
          };
        }
      },
    }),

    documentId: Property.Dropdown({
      auth: wauldAuth,
      displayName: 'Document',
      description:
        'Select the document whose issued credentials should trigger this flow.',
      required: true,
      refreshers: ['engagementId'],
      options: async ({
        auth,
        engagementId,
      }) => {
        if (!auth || !engagementId) {
          return {
            disabled: true,
            options: [],
            placeholder:
              'Select an engagement first',
          };
        }

        try {
          const documents = await fetchDocuments(
            auth.props.accessToken,
            engagementId as string,
          );

          return {
            disabled: false,
            options: documents.map((document) => ({
              label: document.name,
              value: document.id,
            })),
          };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder:
              'Unable to load documents',
          };
        }
      },
    }),
  },

  sampleData: {},

  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const response =
      await httpClient.sendRequest<CreateWebhookResponse>({
        method: HttpMethod.POST,
        url:
          `${WAULD_BASE_URL}` +
          '/wauld.WebhookService/CreateWebhook',
        headers: {
          Authorization:
            `Bearer ${context.auth.props.accessToken}`,
          'Connect-Protocol-Version': '1',
          'Content-Type': 'application/json',
        },
        body: {
          parent: context.auth.props.accountId,
          url: context.webhookUrl,
          events: ['CREDENTIAL_ISSUED'],
          name: `Activepieces ${Date.now()}`,
        },
      });

    const webhookId =
      response.body.id ??
      response.body.webhook?.id;

    if (!webhookId) {
      throw new Error(
        'Wauld created the webhook but did not return its ID.',
      );
    }

    await context.store?.put<StoredWebhook>(
      WEBHOOK_STORE_KEY,
      {
        id: webhookId,
      },
    );
  },

  async onDisable(context) {
    const storedWebhook =
      await context.store?.get<StoredWebhook>(
        WEBHOOK_STORE_KEY,
      );

    if (!storedWebhook?.id) {
      return;
    }

    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url:
        `${WAULD_BASE_URL}` +
        '/wauld.WebhookService/DeleteWebhook',
      headers: {
        Authorization:
          `Bearer ${context.auth.props.accessToken}`,
        'Connect-Protocol-Version': '1',
        'Content-Type': 'application/json',
      },
      body: {
        id: storedWebhook.id,
      },
    });
  },

  async test(context) {
    const documentId =
      context.propsValue.documentId;

    if (!documentId) {
      throw new Error(
        'Select a Wauld document before loading sample data.',
      );
    }

    const response =
      await httpClient.sendRequest<ListCredentialsResponse>({
        method: HttpMethod.POST,
        url:
          `${WAULD_BASE_URL}` +
          '/wauld.CredentialService/ListCredentials',
        headers: {
          Authorization:
            `Bearer ${context.auth.props.accessToken}`,
          'Connect-Protocol-Version': '1',
          'Content-Type': 'application/json',
        },
        body: {
          parent: documentId,
          pageSize: 3,
          orderBy: 'PUBLISH_TIME',
          orderDirection: 'DESCENDING',
          includeVoid: false,
          excludeRevoked: true,
          draft: false,
        },
      });

    const credentials =
      response.body.credentials ?? [];

    if (credentials.length === 0) {
      throw new Error(
        'No issued credentials were found for the selected Wauld document.',
      );
    }

    return credentials.slice(0, 3);
  },

  async run(context) {
    /*
     * The webhook payload is temporarily returned
     * without document filtering.
     *
     * After confirming the exact Wauld webhook
     * payload structure, filter it using the
     * selected documentId.
     */
    return [context.payload.body ?? {}];
  },
});
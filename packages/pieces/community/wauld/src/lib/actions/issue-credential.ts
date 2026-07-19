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
};

type WauldDocument = {
  id: string;
  name: string;
  customAttributes?: string[];
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

type CredentialAttribute = {
  name?: string;
  value?: string;
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
        url: `${WAULD_BASE_URL}/wauld.DocumentService/ListDocuments`,
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

    documents.push(...(response.body.documents ?? []));
    pageToken = response.body.nextPageToken;
  } while (pageToken);

  return documents;
}

export const issueCredential = createAction({
  name: 'issue_credential',
  auth: wauldAuth,
  displayName: 'Issue Credential',
  description:
    'Issues a new credential using the selected document and recipient details.',
  props: {
    workspaceId: Property.Dropdown<
      string,
      true,
      typeof wauldAuth
    >({
      auth: wauldAuth,
      displayName: 'Workspace',
      description: 'Choose the Wauld workspace where the document to be issued is located.',
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
      auth: wauldAuth,
      displayName: 'Engagement',
      description: 'Choose the engagement within which the document to be issued is located.',
      required: true,
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

    documentId: Property.Dropdown({
      auth: wauldAuth,
      displayName: 'Document',
      description:
        'Choose the document that is to be issued as a credential.',
      required: true,
      refreshers: ['engagementId'],
      options: async ({ auth, engagementId }) => {
        if (!auth || !engagementId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Select an engagement first',
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
            placeholder: 'Unable to load documents',
          };
        }
      },
    }),

    recipientName: Property.ShortText({
      displayName: 'Recipient Name',
      description:
        'Enter the full name of the recipient that will receive the credential.',
      required: true,
    }),

    recipientEmail: Property.ShortText({
      displayName: 'Recipient Email',
      description:
        'Enter the email address of the recipient. Wauld will send the issued credential to this email address.',
      required: true,
    }),

    attributes: Property.Array({
      displayName: 'Custom Attributes',
      description:
        'Add values for custom attributes configured on the selected document.',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Attribute Name',
          description:
            'Enter the custom attribute name exactly as configured in Wauld.',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Attribute Value',
          description: 'Enter the value for this attribute.',
          required: true,
        }),
      },
      defaultValue: [],
    }),

    sharable: Property.Checkbox({
      displayName: 'Shareable',
      description:
        'Choose whether recipients can share issued credentials externally.',
      required: false,
      defaultValue: false,
    }),

    linkedIn: Property.Checkbox({
      displayName: 'Add to LinkedIn',
      description:
        'Choose whether recipients can add issued credentials to their LinkedIn profiles.',
      required: false,
      defaultValue: false,
    }),

    expireTime: Property.DateTime({
      displayName: 'Expiry Date',
      description:
        'Enter the expiry date for the credential to be issued. Leave this field blank if the credential should never expire.',
      required: false,
    }),
  },

  audience: 'both',

  aiMetadata: {
    description:
      'Issues a new credential using the selected document and recipient details.',
    idempotent: false,
  },

  async run(context) {
    const rawAttributes =
      (context.propsValue.attributes ?? []) as CredentialAttribute[];

    const attributes = rawAttributes
      .filter(
        (attribute) =>
          attribute.name?.trim() && attribute.value?.trim(),
      )
      .map((attribute) => ({
        name: attribute.name!.trim(),
        value: attribute.value!.trim(),
      }));

    const body: Record<string, unknown> = {
      parent: context.propsValue.documentId,
      recipient: {
        name: context.propsValue.recipientName,
        email: context.propsValue.recipientEmail,
      },
      attributes,
      sharable: context.propsValue.sharable ?? false,
      linkedIn: context.propsValue.linkedIn ?? false,
    };

    if (context.propsValue.expireTime) {
      body['expireTime'] = new Date(
        context.propsValue.expireTime,
      ).toISOString();
    }

    const response = await httpClient.sendRequest<unknown>({
      method: HttpMethod.POST,
      url: `${WAULD_BASE_URL}/wauld.CredentialService/PublishAdhocCredential`,
      headers: {
        Authorization:
          `Bearer ${context.auth.props.accessToken}`,
        'Connect-Protocol-Version': '1',
        'Content-Type': 'application/json',
      },
      body,
    });

    return {
  success: true,
  message: 'Credential issued successfully',
  documentId: context.propsValue.documentId,
  recipient: {
    name: context.propsValue.recipientName,
    email: context.propsValue.recipientEmail,
  },
  attributes,
  sharing: {
    sharable: context.propsValue.sharable ?? false,
    linkedIn: context.propsValue.linkedIn ?? false,
  },
  expireTime: context.propsValue.expireTime ?? null,
  apiResponse: response.body ?? null,
};
  },
});
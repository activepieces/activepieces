import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

function sanitizeOrgUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function escapeWiqlString(value: string): string {
  return value.replace(/'/g, "''");
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function asAzureAuth(auth: unknown): AzureDevOpsAuth {
  return auth as AzureDevOpsAuth;
}

function narrowString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Expected non-empty string for "${fieldName}", got ${typeof value}`);
  }
  return value;
}

const authDescription = `To get your Personal Access Token (PAT):

1. Go to **Azure DevOps** and click your profile icon (top-right)
2. Select **Personal access tokens**
3. Click **+ New Token**
4. Give it a name and set expiration
5. Under **Scopes**, select:
   - **Work Items**: Read & Write
   - **Project and Team**: Read
6. Click **Create** and copy the token (you won't see it again)

**Organization URL** is your Azure DevOps URL, e.g. \`https://dev.azure.com/mycompany\``;

export const azureDevOpsAuth = PieceAuth.CustomAuth({
  description: authDescription,
  required: true,
  props: {
    organizationUrl: Property.ShortText({
      displayName: 'Organization URL',
      description: 'Your Azure DevOps organization URL (e.g. https://dev.azure.com/mycompany)',
      required: true,
    }),
    pat: PieceAuth.SecretText({
      displayName: 'Personal Access Token',
      description: 'Your Azure DevOps PAT with Work Items (Read & Write) and Project and Team (Read) scopes.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    if (!isValidUrl(auth.organizationUrl)) {
      return { valid: false, error: 'Organization URL must be a valid HTTP/HTTPS URL' };
    }
    const orgUrl = sanitizeOrgUrl(auth.organizationUrl);
    const encoded = Buffer.from(`:${auth.pat}`).toString('base64');
    try {
      const response = await httpClient.sendRequest<ProjectListResponse>({
        method: HttpMethod.GET,
        url: `${orgUrl}/_apis/projects`,
        headers: { Authorization: `Basic ${encoded}` },
        queryParams: { 'api-version': '7.1' },
      });
      if (response.body.value !== undefined) {
        return { valid: true };
      }
      return { valid: false, error: 'Invalid PAT or Organization URL' };
    } catch {
      return { valid: false, error: 'Invalid PAT or Organization URL' };
    }
  },
});

export type AzureDevOpsAuth = AppConnectionValueForAuthProperty<typeof azureDevOpsAuth>;

async function azureDevOpsApiCall<T extends HttpMessageBody>({
  organizationUrl,
  pat,
  method,
  endpoint,
  body,
  queryParams,
  isJsonPatch = false,
}: {
  organizationUrl: string;
  pat: string;
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
  queryParams?: Record<string, string>;
  isJsonPatch?: boolean;
}): Promise<T> {
  const baseUrl = sanitizeOrgUrl(organizationUrl);
  const encoded = Buffer.from(`:${pat}`).toString('base64');

  const qs: QueryParams = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        qs[key] = value;
      }
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Basic ${encoded}`,
  };

  if (body !== undefined) {
    headers['Content-Type'] = isJsonPatch
      ? 'application/json-patch+json'
      : 'application/json';
  }

  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl}${endpoint}`,
    headers,
    queryParams: qs,
    body,
  });

  return response.body;
}

async function fetchProjects(auth: AzureDevOpsAuth): Promise<ProjectListResponse> {
  return azureDevOpsApiCall<ProjectListResponse>({
    organizationUrl: auth.props.organizationUrl,
    pat: auth.props.pat,
    method: HttpMethod.GET,
    endpoint: '/_apis/projects',
    queryParams: { 'api-version': '7.1' },
  });
}

async function fetchWorkItemTypes(
  auth: AzureDevOpsAuth,
  project: string,
): Promise<WorkItemTypeListResponse> {
  return azureDevOpsApiCall<WorkItemTypeListResponse>({
    organizationUrl: auth.props.organizationUrl,
    pat: auth.props.pat,
    method: HttpMethod.GET,
    endpoint: `/${encodeURIComponent(project)}/_apis/wit/workitemtypes`,
    queryParams: { 'api-version': '7.1' },
  });
}

function flattenWorkItem(workItem: AzureDevOpsWorkItem): FlatWorkItem {
  const fields = workItem.fields;
  return {
    id: workItem.id,
    rev: workItem.rev,
    url: workItem.url ?? null,
    title: fields['System.Title'] ?? null,
    work_item_type: fields['System.WorkItemType'] ?? null,
    state: fields['System.State'] ?? null,
    reason: fields['System.Reason'] ?? null,
    assigned_to: fields['System.AssignedTo']?.displayName ?? null,
    assigned_to_email: fields['System.AssignedTo']?.uniqueName ?? null,
    created_date: fields['System.CreatedDate'] ?? null,
    created_by: fields['System.CreatedBy']?.displayName ?? null,
    changed_date: fields['System.ChangedDate'] ?? null,
    changed_by: fields['System.ChangedBy']?.displayName ?? null,
    area_path: fields['System.AreaPath'] ?? null,
    iteration_path: fields['System.IterationPath'] ?? null,
    priority: fields['Microsoft.VSTS.Common.Priority'] ?? null,
    description: fields['System.Description'] ?? null,
    project: fields['System.TeamProject'] ?? null,
  };
}

async function fetchWorkItemsByIds({
  organizationUrl,
  pat,
  ids,
}: {
  organizationUrl: string;
  pat: string;
  ids: number[];
}): Promise<FlatWorkItem[]> {
  if (ids.length === 0) {
    return [];
  }

  const results: FlatWorkItem[] = [];
  const batchSize = 200;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const response = await azureDevOpsApiCall<WorkItemBatchResponse>({
      organizationUrl,
      pat,
      method: HttpMethod.GET,
      endpoint: '/_apis/wit/workitems',
      queryParams: {
        ids: batch.join(','),
        '$expand': 'all',
        'api-version': '7.1',
      },
    });

    if (response.value) {
      results.push(...response.value.map(flattenWorkItem));
    }
  }

  return results;
}

async function createSubscription({
  auth,
  projectId,
  eventType,
  webhookUrl,
  workItemType,
}: {
  auth: AzureDevOpsAuth;
  projectId: string;
  eventType: AzureDevOpsHookEvent;
  webhookUrl: string;
  workItemType?: string;
}): Promise<SubscriptionResponse> {
  const publisherInputs: Record<string, string> = { projectId };
  if (workItemType) {
    publisherInputs['workItemType'] = workItemType;
  }

  return azureDevOpsApiCall<SubscriptionResponse>({
    organizationUrl: auth.props.organizationUrl,
    pat: auth.props.pat,
    method: HttpMethod.POST,
    endpoint: '/_apis/hooks/subscriptions',
    queryParams: { 'api-version': '7.1' },
    body: {
      publisherId: 'tfs',
      eventType,
      resourceVersion: '1.0',
      consumerId: 'webHooks',
      consumerActionId: 'httpRequest',
      publisherInputs,
      consumerInputs: {
        url: webhookUrl,
        resourceDetailsToSend: 'all',
        messagesToSend: 'none',
        detailedMessagesToSend: 'none',
      },
    },
  });
}

async function deleteSubscription({
  auth,
  subscriptionId,
}: {
  auth: AzureDevOpsAuth;
  subscriptionId: string;
}): Promise<void> {
  await azureDevOpsApiCall<void>({
    organizationUrl: auth.props.organizationUrl,
    pat: auth.props.pat,
    method: HttpMethod.DELETE,
    endpoint: `/_apis/hooks/subscriptions/${subscriptionId}`,
    queryParams: { 'api-version': '7.1' },
  });
}

async function fetchProjectId(
  auth: AzureDevOpsAuth,
  projectName: string,
): Promise<string | null> {
  const project = await azureDevOpsApiCall<ProjectReference>({
    organizationUrl: auth.props.organizationUrl,
    pat: auth.props.pat,
    method: HttpMethod.GET,
    endpoint: `/_apis/projects/${encodeURIComponent(projectName)}`,
    queryParams: { 'api-version': '7.1' },
  });
  return project.id ?? null;
}

async function fetchTeamMembers(
  auth: AzureDevOpsAuth,
  projectName: string,
): Promise<IdentityRef[]> {
  const teamsResponse = await azureDevOpsApiCall<TeamListResponse>({
    organizationUrl: auth.props.organizationUrl,
    pat: auth.props.pat,
    method: HttpMethod.GET,
    endpoint: `/_apis/projects/${encodeURIComponent(projectName)}/teams`,
    queryParams: { 'api-version': '7.1', '$top': '100' },
  });

  const seen = new Map<string, IdentityRef>();
  for (const team of teamsResponse.value ?? []) {
    const members = await azureDevOpsApiCall<TeamMemberListResponse>({
      organizationUrl: auth.props.organizationUrl,
      pat: auth.props.pat,
      method: HttpMethod.GET,
      endpoint: `/_apis/projects/${encodeURIComponent(projectName)}/teams/${team.id}/members`,
      queryParams: { 'api-version': '7.1', '$top': '200' },
    });
    for (const member of members.value ?? []) {
      const identity = member.identity;
      if (identity?.id && !seen.has(identity.id)) {
        seen.set(identity.id, identity);
      }
    }
  }
  return Array.from(seen.values());
}

async function fetchWorkItemTypeStates(
  auth: AzureDevOpsAuth,
  projectName: string,
  workItemType: string,
): Promise<WorkItemStateColor[]> {
  const response = await azureDevOpsApiCall<WorkItemTypeResponse>({
    organizationUrl: auth.props.organizationUrl,
    pat: auth.props.pat,
    method: HttpMethod.GET,
    endpoint: `/${encodeURIComponent(projectName)}/_apis/wit/workitemtypes/${encodeURIComponent(workItemType)}`,
    queryParams: { 'api-version': '7.1' },
  });
  return response.states ?? [];
}

function createAssignedToDropdown(required: boolean) {
  return Property.Dropdown({
    displayName: 'Assigned To',
    description:
      'Select the person to assign this work item to. Only project team members are listed — use the Custom API Call action if you need to assign a user outside your teams.',
    refreshers: ['project'],
    required,
    auth: azureDevOpsAuth,
    options: async ({ auth, project }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Azure DevOps account first',
        };
      }
      if (!project) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a project first',
        };
      }
      const typedAuth = asAzureAuth(auth);
      try {
        const members = await fetchTeamMembers(typedAuth, narrowString(project, 'project'));
        if (members.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No team members found in this project.',
          };
        }
        return {
          disabled: false,
          options: members.map((m) => ({
            label: m.uniqueName ? `${m.displayName} (${m.uniqueName})` : m.displayName,
            value: m.uniqueName ?? m.displayName,
          })),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load team members. Check your connection.',
        };
      }
    },
  });
}

function createStateDropdown(required: boolean, description: string) {
  return Property.Dropdown({
    displayName: 'State',
    description,
    refreshers: ['project', 'work_item_type'],
    required,
    auth: azureDevOpsAuth,
    options: async ({ auth, project, work_item_type }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Azure DevOps account first',
        };
      }
      if (!project) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a project first',
        };
      }
      if (!work_item_type) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a work item type first',
        };
      }
      const typedAuth = asAzureAuth(auth);
      try {
        const states = await fetchWorkItemTypeStates(
          typedAuth,
          narrowString(project, 'project'),
          narrowString(work_item_type, 'work_item_type'),
        );
        if (states.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No states defined for this work item type.',
          };
        }
        return {
          disabled: false,
          options: states.map((s) => ({
            label: s.category ? `${s.name} (${s.category})` : s.name,
            value: s.name,
          })),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load states. Check your connection.',
        };
      }
    },
  });
}

function createWorkItemTypeDropdown(required: boolean, description: string) {
  return Property.Dropdown({
    displayName: 'Work Item Type',
    description,
    refreshers: ['project'],
    required,
    auth: azureDevOpsAuth,
    options: async ({ auth, project }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Azure DevOps account first',
        };
      }
      if (!project) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a project first',
        };
      }
      const typedAuth = asAzureAuth(auth);
      try {
        const response = await fetchWorkItemTypes(typedAuth, narrowString(project, 'project'));
        if (!response.value || response.value.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No work item types found.',
          };
        }
        return {
          disabled: false,
          options: response.value.map((t) => ({
            label: t.name,
            value: t.name,
          })),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load work item types. Check your connection.',
        };
      }
    },
  });
}

export const azureDevOpsCommon = {
  projectDropdown: Property.Dropdown({
    displayName: 'Project',
    description: 'Select the Azure DevOps project',
    refreshers: [],
    required: true,
    auth: azureDevOpsAuth,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Azure DevOps account first',
        };
      }
      const typedAuth = asAzureAuth(auth);
      try {
        const response = await fetchProjects(typedAuth);
        if (!response.value || response.value.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No projects found. Create one in Azure DevOps first.',
          };
        }
        return {
          disabled: false,
          options: response.value.map((p) => ({
            label: p.name,
            value: p.name,
          })),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load projects. Check your connection.',
        };
      }
    },
  }),

  workItemTypeDropdown: createWorkItemTypeDropdown(
    true,
    'Select the type of work item (e.g. Bug, Task, User Story)',
  ),

  workItemTypeDropdownOptional: createWorkItemTypeDropdown(
    false,
    'Filter by work item type. Leave empty to trigger for all types.',
  ),

  assignedToDropdown: createAssignedToDropdown(false),

  stateDropdown: createStateDropdown(false, 'New state for the work item'),

  stateDropdownOptional: createStateDropdown(
    false,
    'Filter by state. Leave empty to trigger for all states.',
  ),

  priorityDropdown: Property.StaticDropdown({
    displayName: 'Priority',
    description: 'The priority of the work item',
    required: false,
    options: {
      options: [
        { label: '1 - Critical', value: '1' },
        { label: '2 - High', value: '2' },
        { label: '3 - Medium', value: '3' },
        { label: '4 - Low', value: '4' },
      ],
    },
  }),

  escapeWiqlString,
  sanitizeOrgUrl,
  isValidUrl,
  asAuth: asAzureAuth,
  narrowString,
  apiCall: azureDevOpsApiCall,
  fetchWorkItemsByIds,
  flattenWorkItem,
  fetchProjectId,
  fetchTeamMembers,
  fetchWorkItemTypeStates,
  createSubscription,
  deleteSubscription,
};

export interface JsonPatchOperation {
  op: 'add' | 'replace' | 'remove' | 'test';
  path: string;
  value?: unknown;
}

export interface IdentityRef {
  displayName: string;
  uniqueName: string;
  id: string;
}

export interface AzureDevOpsWorkItem {
  id: number;
  rev: number;
  url?: string;
  fields: Record<string, unknown> & {
    'System.Title'?: string;
    'System.WorkItemType'?: string;
    'System.State'?: string;
    'System.Reason'?: string;
    'System.AssignedTo'?: IdentityRef;
    'System.CreatedDate'?: string;
    'System.CreatedBy'?: IdentityRef;
    'System.ChangedDate'?: string;
    'System.ChangedBy'?: IdentityRef;
    'System.AreaPath'?: string;
    'System.IterationPath'?: string;
    'System.TeamProject'?: string;
    'System.Description'?: string;
    'Microsoft.VSTS.Common.Priority'?: number;
  };
}

export interface FlatWorkItem {
  id: number;
  rev: number;
  url: string | null;
  title: string | null;
  work_item_type: string | null;
  state: string | null;
  reason: string | null;
  assigned_to: string | null;
  assigned_to_email: string | null;
  created_date: string | null;
  created_by: string | null;
  changed_date: string | null;
  changed_by: string | null;
  area_path: string | null;
  iteration_path: string | null;
  priority: number | null;
  description: string | null;
  project: string | null;
}

export interface WiqlResponse {
  queryType: string;
  queryResultType: string;
  asOf: string;
  workItems: Array<{
    id: number;
    url: string;
  }>;
}

export interface ProjectListResponse {
  count: number;
  value: Array<{
    id: string;
    name: string;
    state: string;
  }>;
}

interface WorkItemTypeListResponse {
  count: number;
  value: Array<{
    name: string;
    description: string;
  }>;
}

interface WorkItemBatchResponse {
  count: number;
  value: AzureDevOpsWorkItem[];
}

interface ProjectReference {
  id: string;
  name: string;
  state?: string;
}

interface TeamListResponse {
  count: number;
  value: Array<{ id: string; name: string; projectId: string }>;
}

interface TeamMemberListResponse {
  count: number;
  value: Array<{ identity: IdentityRef }>;
}

interface WorkItemTypeResponse {
  name: string;
  states?: WorkItemStateColor[];
}

export interface WorkItemStateColor {
  name: string;
  color?: string;
  category?: string;
}

export type AzureDevOpsHookEvent =
  | 'workitem.created'
  | 'workitem.updated'
  | 'workitem.commented';

export interface SubscriptionResponse {
  id: string;
  publisherId: string;
  eventType: string;
  consumerId: string;
  consumerActionId: string;
}

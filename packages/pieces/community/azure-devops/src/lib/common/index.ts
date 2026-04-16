import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { azureDevOpsAuth } from '../../';

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

export async function azureDevOpsApiCall<T extends HttpMessageBody>({
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

async function fetchProjects(auth: {
  props: { organizationUrl: string; pat: string };
}): Promise<ProjectListResponse> {
  return azureDevOpsApiCall<ProjectListResponse>({
    organizationUrl: auth.props.organizationUrl,
    pat: auth.props.pat,
    method: HttpMethod.GET,
    endpoint: '/_apis/projects',
    queryParams: { 'api-version': '7.1' },
  });
}

async function fetchWorkItemTypes(
  auth: { props: { organizationUrl: string; pat: string } },
  project: string
): Promise<WorkItemTypeListResponse> {
  return azureDevOpsApiCall<WorkItemTypeListResponse>({
    organizationUrl: auth.props.organizationUrl,
    pat: auth.props.pat,
    method: HttpMethod.GET,
    endpoint: `/${encodeURIComponent(project)}/_apis/wit/workitemtypes`,
    queryParams: { 'api-version': '7.1' },
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
      const typedAuth = auth as { props: { organizationUrl: string; pat: string } };
      try {
        const response = await fetchWorkItemTypes(typedAuth, String(project));
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
      const typedAuth = auth as { props: { organizationUrl: string; pat: string } };
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
    'Select the type of work item (e.g. Bug, Task, User Story)'
  ),

  workItemTypeDropdownOptional: createWorkItemTypeDropdown(
    false,
    'Filter by work item type. Leave empty to trigger for all types.'
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
};

export function flattenWorkItem(workItem: AzureDevOpsWorkItem): FlatWorkItem {
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

export async function fetchWorkItemsByIds({
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

interface ProjectListResponse {
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

interface WorkItemBatchResponse {
  count: number;
  value: AzureDevOpsWorkItem[];
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

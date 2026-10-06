import {
  AppConnectionValueForAuthProperty,
  DropdownState,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { flowluAuth } from '../auth';
import { FlowluApiError, FlowluClient, FormValue } from './client';

export function makeClient(
  auth: AppConnectionValueForAuthProperty<typeof flowluAuth>
): FlowluClient {
  return new FlowluClient(auth.props.domain, auth.props.apiKey);
}

export const flowluCommon = {
  task_id: (required = true) =>
    searchableDropdown({
      displayName: 'Task ID',
      required,
      path: '/task/tasks/list',
      label: (item) => textOf(item['name']),
    }),
  user_id: (required = true, displayName = 'User ID') =>
    searchableDropdown({
      displayName,
      required,
      path: '/core/user/list',
      label: (item) => textOf(item['name']),
    }),
  workflow_id: (required = false) =>
    simpleDropdown({
      displayName: 'Task Workflow ID',
      required,
      path: '/task/workflows/list',
    }),
  workflow_stage_id: (required = false) =>
    simpleDropdown({
      displayName: 'Task Workflow Status ID',
      required,
      path: '/task/stages/list',
    }),
  honorific_title_id: (required = false) =>
    simpleDropdown({
      displayName: 'Title',
      required,
      path: '/crm/honorific_title/list',
    }),
  account_category_id: (required = false) =>
    simpleDropdown({
      displayName: 'Account Category',
      required,
      path: '/crm/account_category/list',
    }),
  industry_id: (required = false) =>
    simpleDropdown({
      displayName: 'Account Industry',
      required,
      path: '/crm/industry/list',
    }),
  source_id: (required = false) =>
    simpleDropdown({
      displayName: 'Opportunity Source',
      required,
      path: '/crm/source/list',
    }),
  loss_reason_id: (required = false) =>
    simpleDropdown({
      displayName: 'Loss Reason',
      description:
        'Why the opportunity was lost. Only used when Status is Lost.',
      required,
      path: '/crm/loss_reason/list',
    }),
  opportunity_id: (required = false) =>
    searchableDropdown({
      displayName: 'Opportunity ID',
      required,
      path: '/crm/lead/list',
      label: (item) => textOf(item['name']),
    }),
  account_id: (
    required = false,
    displayName = 'Account ID',
    description = ''
  ) =>
    searchableDropdown({
      displayName,
      description,
      required,
      path: '/crm/account/list',
      label: (item) => textOf(item['name']),
    }),
  contact_id: (
    required = false,
    displayName = 'Contact ID',
    description = ''
  ) =>
    searchableDropdown({
      displayName,
      description,
      required,
      path: '/crm/account/list',
      filter: { 'filter[type]': '2' },
      label: (item) => textOf(item['name']),
    }),
  organization_id: (
    required = false,
    displayName = 'Organization',
    description = ''
  ) =>
    searchableDropdown({
      displayName,
      description,
      required,
      path: '/crm/account/list',
      filter: { 'filter[type]': '1' },
      label: (item) => textOf(item['name']),
    }),
  project_id: (required = false, displayName = 'Project', description = '') =>
    searchableDropdown({
      displayName,
      description,
      required,
      path: '/st/projects/list',
      label: (item) => textOf(item['name']),
    }),
  project_template_id: (required = false) =>
    simpleDropdown({
      displayName: 'Project Template',
      required,
      path: '/st/project_types/list',
    }),
  portfolio_id: (required = false) =>
    simpleDropdown({
      displayName: 'Portfolio',
      required,
      path: '/st/portfolio/list',
    }),
  pipeline_id: (required = false) =>
    simpleDropdown({
      displayName: 'Sales Pipeline ID',
      required,
      path: '/crm/pipeline/list',
    }),
  pipeline_stage_id: (required = false) =>
    Property.Dropdown({
      auth: flowluAuth,
      displayName: 'Sales Pipeline Stage ID',
      required,
      refreshers: ['pipeline_id'],
      options: async ({ auth, pipeline_id }) => {
        if (!auth || !pipeline_id) {
          return {
            disabled: true,
            placeholder:
              'Connect your account first and select sales pipeline.',
            options: [],
          };
        }
        return loadOptions({
          client: () => makeClient(auth),
          path: '/crm/pipeline_stage/list',
          query: {
            'filter[pipeline_id]': String(pipeline_id),
            'order_by[asc][]': 'id',
          },
          label: (item) => textOf(item['name']),
        });
      },
    }),
};

function simpleDropdown({
  displayName,
  description,
  required,
  path,
}: {
  displayName: string;
  description?: string;
  required: boolean;
  path: string;
}) {
  return Property.Dropdown({
    auth: flowluAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your account first',
          options: [],
        };
      }
      return loadOptions({
        client: () => makeClient(auth),
        path,
        query: { 'order_by[asc][]': 'id' },
        label: (item) => textOf(item['name']),
      });
    },
  });
}

function searchableDropdown({
  displayName,
  description,
  required,
  path,
  filter,
  label,
}: {
  displayName: string;
  description?: string;
  required: boolean;
  path: string;
  filter?: Record<string, FormValue>;
  label: (item: Record<string, unknown>) => string;
}) {
  return Property.Dropdown({
    auth: flowluAuth,
    displayName,
    description,
    required,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your account first',
          options: [],
        };
      }
      const search = searchValue?.trim() ?? '';
      return loadOptions({
        client: () => makeClient(auth),
        path,
        query: {
          ...filter,
          'order_by[desc][]': 'id',
          search: search === '' ? undefined : search,
        },
        label,
        searchHint: search === '',
      });
    },
  });
}

async function loadOptions({
  client,
  path,
  query,
  label,
  searchHint = false,
}: {
  client: () => FlowluClient;
  path: string;
  query: Record<string, FormValue>;
  label: (item: Record<string, unknown>) => string;
  searchHint?: boolean;
}): Promise<DropdownState<number>> {
  try {
    const res = await client().request<{
      response: {
        items?: Record<string, unknown>[];
        total_result?: number;
        total?: number;
      };
    }>({
      method: HttpMethod.GET,
      path,
      query: { ...query, limit: DROPDOWN_LIMIT },
    });
    const items = Array.isArray(res.response?.items) ? res.response.items : [];
    const options = items.flatMap((item) => {
      const id = Number(item['id']);
      if (!Number.isFinite(id)) {
        return [];
      }
      const text = label(item);
      return [
        { label: text === '' ? `#${id}` : `${text} (#${id})`, value: id },
      ];
    });
    const total = Number(
      res.response?.total_result ?? res.response?.total ?? options.length
    );
    const truncated = total > options.length;
    return {
      disabled: false,
      options,
      placeholder: truncated
        ? searchHint
          ? `Showing the latest ${options.length} of ${total}. Type to search.`
          : `Showing the first ${options.length} of ${total}.`
        : options.length === 0
        ? 'No records found'
        : undefined,
    };
  } catch (error) {
    return {
      disabled: true,
      options: [],
      placeholder:
        error instanceof FlowluApiError
          ? error.message
          : 'Could not load options from Flowlu.',
    };
  }
}

function textOf(value: unknown): string {
  return typeof value === 'string'
    ? value.trim()
    : typeof value === 'number'
    ? String(value)
    : '';
}

const DROPDOWN_LIMIT = 100;

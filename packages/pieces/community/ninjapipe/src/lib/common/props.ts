import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { NinjaPipeAuth, NinjaPipeRecord, ninjapipeClient } from './client';

function contactLabel(item: NinjaPipeRecord): string {
  const name = [item['first_name'], item['last_name']].filter((part) => typeof part === 'string' && part.trim() !== '').join(' ');
  const email = typeof item['email'] === 'string' && item['email'] !== '' ? `<${item['email']}>` : '';
  return [name, email].filter((part) => part !== '').join(' ') || String(item['id'] ?? '');
}

function nameLabel(item: NinjaPipeRecord): string {
  const name = item['name'] ?? item['title'] ?? item['order_number'];
  return typeof name === 'string' && name.trim() !== '' ? name : String(item['id'] ?? '');
}

function orderLabel(item: NinjaPipeRecord): string {
  const parts = [item['order_number'], item['customer_name']].filter((part) => typeof part === 'string' && part.trim() !== '');
  return parts.length > 0 ? parts.join(' — ') : String(item['id'] ?? '');
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function collectOptions({
  auth,
  path,
  label,
  search,
  paged,
}: {
  auth: NinjaPipeAuth;
  path: string;
  label: (item: NinjaPipeRecord) => string;
  search?: string;
  paged: boolean;
}): Promise<{ label: string; value: string }[]> {
  const query = search && search.trim() !== '' ? { search: search.trim() } : undefined;
  const items: NinjaPipeRecord[] = [];
  if (!paged) {
    const body = await ninjapipeClient.ninjapipeRequest({ auth, method: HttpMethod.GET, path, query, operation: 'load options' });
    items.push(...ninjapipeClient.readItems(body));
  } else {
    for (let page = 1; page <= DROPDOWN_MAX_PAGES; page++) {
      const result = await ninjapipeClient.listPage({ auth, path, query, page, limit: 100, operation: 'load options' });
      items.push(...result.items);
      if (!result.hasMore || result.items.length === 0) break;
    }
  }
  return items
    .filter((item) => item['id'] !== undefined && item['id'] !== null)
    .map((item) => ({ label: label(item), value: String(item['id']) }));
}

async function loadOptions({
  auth,
  path,
  noun,
  label,
  search,
  paged = true,
}: {
  auth: unknown;
  path: string;
  noun: string;
  label: (item: NinjaPipeRecord) => string;
  search?: string;
  paged?: boolean;
}) {
  if (!auth) return { disabled: true, options: [], placeholder: 'Connect your NinjaPipe account first.' };
  try {
    const options = await collectOptions({ auth: ninjapipeClient.readAuth(auth), path, label, search, paged });
    return {
      disabled: false,
      options,
      placeholder: options.length === 0 ? `No ${noun} found in this workspace.` : undefined,
    };
  } catch (error) {
    return { disabled: true, options: [], placeholder: `Could not load ${noun}: ${errorText(error)}` };
  }
}

function recordDropdown<R extends boolean>({
  displayName,
  description,
  required,
  path,
  noun,
  label = nameLabel,
  searchable = false,
}: {
  displayName: string;
  description: string;
  required: R;
  path: string;
  noun: string;
  label?: (item: NinjaPipeRecord) => string;
  searchable?: boolean;
}) {
  return Property.Dropdown({
    auth: ninjapipeAuth,
    displayName,
    description,
    required,
    refreshers: [],
    refreshOnSearch: searchable,
    options: async ({ auth }, ctx) => loadOptions({ auth, path, noun, label, search: searchable ? ctx.searchValue : undefined }),
  });
}

async function loadMembers({ auth }: { auth: unknown }) {
  if (!auth) return { disabled: true, options: [], placeholder: 'Connect your NinjaPipe account first.' };
  try {
    const body = await ninjapipeClient.ninjapipeRequest({
      auth: ninjapipeClient.readAuth(auth),
      method: HttpMethod.GET,
      path: '/workspace/members',
      operation: 'load workspace members',
    });
    const options = ninjapipeClient
      .readItems(body)
      .filter((member) => typeof member['account_id'] === 'string')
      .map((member) => {
        const name = typeof member['full_name'] === 'string' && member['full_name'] !== '' ? member['full_name'] : String(member['email'] ?? '');
        const email = typeof member['email'] === 'string' ? ` <${member['email']}>` : '';
        return { label: `${name}${email}`, value: String(member['account_id']) };
      });
    return { disabled: false, options };
  } catch (error) {
    return { disabled: true, options: [], placeholder: `Could not load workspace members: ${errorText(error)}` };
  }
}

function ownerDropdown<R extends boolean>({ displayName, description, required }: { displayName: string; description: string; required: R }) {
  return Property.Dropdown({
    auth: ninjapipeAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => loadMembers({ auth }),
  });
}

function taskDropdown() {
  return Property.Dropdown({
    auth: ninjapipeAuth,
    displayName: 'Task',
    description: 'Select a task. Pick the project first.',
    required: true,
    refreshers: ['projectId'],
    options: async ({ auth, projectId }) => {
      if (!projectId) return { disabled: true, options: [], placeholder: 'Select a project first.' };
      return loadOptions({
        auth,
        path: `/projects/${encodeURIComponent(String(projectId))}/tasks`,
        noun: 'tasks',
        paged: false,
        label: nameLabel,
      });
    },
  });
}

function stageDropdown<R extends boolean>({ required, description }: { required: R; description: string }) {
  return Property.Dropdown({
    auth: ninjapipeAuth,
    displayName: 'Stage',
    description,
    required,
    refreshers: ['pipelineId'],
    options: async ({ auth, pipelineId }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Connect your NinjaPipe account first.' };
      if (!pipelineId) return { disabled: true, options: [], placeholder: 'Select a pipeline first.' };
      try {
        const pipeline = await ninjapipeClient.getRecord({
          auth: ninjapipeClient.readAuth(auth),
          path: `/pipelines/${encodeURIComponent(String(pipelineId))}`,
          operation: 'load stages',
        });
        const stages = Array.isArray(pipeline['stages']) ? pipeline['stages'] : [];
        const options = stages
          .filter(ninjapipeClient.isRecord)
          .filter((stage) => stage['id'] !== undefined)
          .map((stage) => ({ label: String(stage['name'] ?? stage['id']), value: String(stage['id']) }));
        return { disabled: false, options };
      } catch (error) {
        return { disabled: true, options: [], placeholder: `Could not load stages: ${errorText(error)}` };
      }
    },
  });
}

function pipelineItemDropdown() {
  return Property.Dropdown({
    auth: ninjapipeAuth,
    displayName: 'Pipeline Item',
    description: 'Select the item (card) to update. Pick the pipeline first.',
    required: true,
    refreshers: ['pipelineId'],
    options: async ({ auth, pipelineId }) => {
      if (!pipelineId) return { disabled: true, options: [], placeholder: 'Select a pipeline first.' };
      return loadOptions({
        auth,
        path: `/pipelines/${encodeURIComponent(String(pipelineId))}/items`,
        noun: 'pipeline items',
        paged: false,
        label: nameLabel,
      });
    },
  });
}

function staticDropdown({
  displayName,
  description,
  values,
}: {
  displayName: string;
  description: string;
  values: string[];
}) {
  return Property.StaticDropdown({
    displayName,
    description,
    required: false,
    options: { options: values.map((value) => ({ label: value, value })) },
  });
}

function clearFields({ fields }: { fields: Record<string, string> }) {
  return Property.StaticMultiSelectDropdown({
    displayName: 'Clear Fields',
    description: 'Fields to empty on the record. A field you clear here must be left blank above.',
    required: false,
    options: { options: Object.entries(fields).map(([value, label]) => ({ label, value })) },
  });
}

function customFields({ update }: { update: boolean }) {
  return Property.Object({
    displayName: 'Custom Fields',
    description: update
      ? 'Custom field values by field key. Keys you leave out keep their current value; set a key to an empty value to clear it.'
      : 'Custom field values by field key (the key shown in NinjaPipe settings).',
    required: false,
  });
}

function limit() {
  return Property.Number({
    displayName: 'Limit',
    description: 'Records per page (1-100). Ignored when Return All is on.',
    required: false,
    defaultValue: 20,
  });
}

function page() {
  return Property.Number({
    displayName: 'Page',
    description: 'Page number to fetch (starts at 1). Ignored when Return All is on.',
    required: false,
    defaultValue: 1,
  });
}

function returnAll() {
  return Property.Checkbox({
    displayName: 'Return All',
    description: `Follow every page (up to ${RETURN_ALL_LABEL} records). Has More is true when the cap cut the list short.`,
    required: false,
    defaultValue: false,
  });
}

function search() {
  return Property.ShortText({ displayName: 'Search', description: 'Text to search for.', required: false });
}

const DROPDOWN_MAX_PAGES = 10;
const RETURN_ALL_LABEL = '5,000';

export const ninjapipeProps = {
  contactRequired: () =>
    recordDropdown({ displayName: 'Contact', description: 'Select a contact, or type to search.', required: true, path: '/contacts', noun: 'contacts', label: contactLabel, searchable: true }),
  contactOptional: () =>
    recordDropdown({ displayName: 'Contact', description: 'Select a contact, or type to search.', required: false, path: '/contacts', noun: 'contacts', label: contactLabel, searchable: true }),
  companyRequired: () =>
    recordDropdown({ displayName: 'Company', description: 'Select a company, or type to search.', required: true, path: '/companies', noun: 'companies', searchable: true }),
  companyOptional: () =>
    recordDropdown({ displayName: 'Company', description: 'Select a company, or type to search.', required: false, path: '/companies', noun: 'companies', searchable: true }),
  dealRequired: () =>
    recordDropdown({ displayName: 'Deal', description: 'Select a deal, or type to search.', required: true, path: '/deals', noun: 'deals', searchable: true }),
  productRequired: () => recordDropdown({ displayName: 'Product', description: 'Select a product.', required: true, path: '/products', noun: 'products' }),
  budgetRequired: () => recordDropdown({ displayName: 'Budget', description: 'Select a budget.', required: true, path: '/budgets', noun: 'budgets' }),
  orderRequired: () => recordDropdown({ displayName: 'Order', description: 'Select an order.', required: true, path: '/orders', noun: 'orders', label: orderLabel }),
  projectRequired: () => recordDropdown({ displayName: 'Project', description: 'Select a project.', required: true, path: '/projects', noun: 'projects' }),
  pipelineRequired: () => recordDropdown({ displayName: 'Pipeline', description: 'Select a pipeline.', required: true, path: '/pipelines', noun: 'pipelines' }),
  task: taskDropdown,
  stageRequired: () => stageDropdown({ required: true, description: 'Stage (column) of the selected pipeline.' }),
  stageOptional: () => stageDropdown({ required: false, description: 'Move the item to this stage. Leave empty to keep its stage.' }),
  pipelineItem: pipelineItemDropdown,
  member: ({ displayName, description }: { displayName: string; description: string }) => ownerDropdown({ displayName, description, required: false }),
  staticDropdown,
  clearFields,
  customFields,
  limit,
  page,
  returnAll,
  search,
};

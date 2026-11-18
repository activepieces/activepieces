import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient, FreshsalesAuthValue } from './client';

export const SELECTOR_TYPES = [
  { label: 'Territories', value: 'territories' },
  { label: 'Contact Statuses', value: 'contact_statuses' },
  { label: 'Lifecycle Stages', value: 'lifecycle_stages' },
  { label: 'Lead Sources', value: 'lead_sources' },
  { label: 'Campaigns', value: 'campaigns' },
  { label: 'Currencies', value: 'currencies' },
  { label: 'Deal Types', value: 'deal_types' },
  { label: 'Deal Reasons', value: 'deal_reasons' },
  { label: 'Industry Types', value: 'industry_types' },
  { label: 'Business Types', value: 'business_types' },
  { label: 'Sales Activity Types', value: 'sales_activity_types' },
];

export const TARGETABLE_TYPES = [
  { label: 'Contact', value: 'Contact' },
  { label: 'Account', value: 'SalesAccount' },
  { label: 'Deal', value: 'Deal' },
];

export const ENTITY_OPTIONS = [
  { label: 'Contacts', value: 'contacts' },
  { label: 'Accounts', value: 'sales_accounts' },
  { label: 'Deals', value: 'deals' },
];

export const FILTER_OPERATORS = [
  { label: 'Is any of', value: 'is_in' },
  { label: 'Is none of', value: 'is_not_in' },
  { label: 'Is after (date)', value: 'is_after' },
  { label: 'Is before (date)', value: 'is_before' },
];

export const freshsalesProps = {
  owner,
  territory,
  contactStatus,
  lifecycleStage,
  leadSource,
  campaign,
  currency,
  dealType,
  industryType,
  businessType,
  dealPipeline,
  dealStage,
  salesActivityType,
  salesActivityOutcome,
  view,
  targetableType,
  targetableId,
  customFields,
  marketingList,
  SELECTOR_TYPES,
  ENTITY_OPTIONS,
  TARGETABLE_TYPES,
  fetchSelector,
  findDefaultViewId,
};

const DEFAULT_VIEW_NAMES: Record<string, string> = {
  contacts: 'All Contacts',
  sales_accounts: 'All Accounts',
  deals: 'All Deals',
};

async function fetchSelector({
  auth,
  path,
}: {
  auth: FreshsalesAuthValue;
  path: string;
}): Promise<SelectorItem[]> {
  const body = await freshsalesClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path,
  });
  return toSelectorItems(body);
}

function toSelectorItems(body: unknown): SelectorItem[] {
  if (!freshsalesClient.isRecord(body)) {
    return [];
  }
  const list = Object.values(body).find((value) => Array.isArray(value));
  if (!Array.isArray(list)) {
    return [];
  }
  const items: SelectorItem[] = [];
  for (const entry of list) {
    if (!freshsalesClient.isRecord(entry) || entry['id'] === undefined) {
      continue;
    }
    const name =
      entry['display_name'] ?? entry['name'] ?? entry['currency_code'] ?? entry['email'];
    items.push({
      id: String(entry['id']),
      name: name === undefined || name === null ? String(entry['id']) : String(name),
      email: typeof entry['email'] === 'string' ? entry['email'] : undefined,
      position: typeof entry['position'] === 'number' ? entry['position'] : undefined,
    });
  }
  return items;
}

function selectorDropdown({
  displayName,
  description,
  path,
  required,
}: {
  displayName: string;
  description: string;
  path: string;
  required: boolean;
}) {
  return Property.Dropdown({
    auth: freshsalesAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your account first.' };
      }
      try {
        const items = await fetchSelector({ auth, path });
        return {
          disabled: false,
          options: items.map((item) => ({ label: item.name, value: item.id })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: error instanceof Error ? error.message : 'Could not load options.',
        };
      }
    },
  });
}

function owner({ required, description }: { required: boolean; description?: string }) {
  return selectorDropdown({
    displayName: 'Owner',
    description: description ?? 'The Freshsales user who owns the record',
    path: '/api/selector/owners',
    required,
  });
}

function marketingList() {
  return selectorDropdown({
    displayName: 'Marketing List',
    description: 'The marketing list to change',
    path: '/api/lists',
    required: true,
  });
}

function territory() {
  return selectorDropdown({
    displayName: 'Territory',
    description: 'The territory the record belongs to',
    path: '/api/selector/territories',
    required: false,
  });
}

function contactStatus() {
  return selectorDropdown({
    displayName: 'Contact Status',
    description: 'The status of the contact',
    path: '/api/selector/contact_statuses',
    required: false,
  });
}

function lifecycleStage() {
  return selectorDropdown({
    displayName: 'Lifecycle Stage',
    description: 'The lifecycle stage of the contact',
    path: '/api/selector/lifecycle_stages',
    required: false,
  });
}

function leadSource() {
  return selectorDropdown({
    displayName: 'Lead Source',
    description: 'Where the record came from',
    path: '/api/selector/lead_sources',
    required: false,
  });
}

function campaign() {
  return selectorDropdown({
    displayName: 'Campaign',
    description: 'The campaign that brought the record',
    path: '/api/selector/campaigns',
    required: false,
  });
}

function currency() {
  return selectorDropdown({
    displayName: 'Currency',
    description: 'Deal currency (defaults to the account currency)',
    path: '/api/selector/currencies',
    required: false,
  });
}

function dealType() {
  return selectorDropdown({
    displayName: 'Deal Type',
    description: 'The type of the deal',
    path: '/api/selector/deal_types',
    required: false,
  });
}

function industryType() {
  return selectorDropdown({
    displayName: 'Industry Type',
    description: 'Industry of the account',
    path: '/api/selector/industry_types',
    required: false,
  });
}

function businessType() {
  return selectorDropdown({
    displayName: 'Business Type',
    description: 'Business type of the account',
    path: '/api/selector/business_types',
    required: false,
  });
}

function dealPipeline() {
  return selectorDropdown({
    displayName: 'Pipeline',
    description: 'The deal pipeline',
    path: '/api/selector/deal_pipelines',
    required: false,
  });
}

function dealStage() {
  return Property.Dropdown({
    auth: freshsalesAuth,
    displayName: 'Deal Stage',
    description: 'Stage of the deal; pick a pipeline first to narrow it',
    required: false,
    refreshers: ['deal_pipeline_id'],
    options: async ({ auth, deal_pipeline_id }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your account first.' };
      }
      const pipelineId =
        typeof deal_pipeline_id === 'string' && deal_pipeline_id.length > 0
          ? deal_pipeline_id
          : undefined;
      try {
        const items = await fetchSelector({
          auth,
          path: pipelineId
            ? `/api/selector/deal_pipelines/${encodeURIComponent(pipelineId)}/deal_stages`
            : '/api/selector/deal_stages',
        });
        return {
          disabled: false,
          options: items.map((item) => ({ label: item.name, value: item.id })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: error instanceof Error ? error.message : 'Could not load stages.',
        };
      }
    },
  });
}

function salesActivityType() {
  return selectorDropdown({
    displayName: 'Activity Type',
    description: 'The sales activity type',
    path: '/api/selector/sales_activity_types',
    required: true,
  });
}

function salesActivityOutcome() {
  return Property.Dropdown({
    auth: freshsalesAuth,
    displayName: 'Outcome',
    description: 'Outcome of the activity (depends on the type)',
    required: false,
    refreshers: ['sales_activity_type_id'],
    options: async ({ auth, sales_activity_type_id }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your account first.' };
      }
      if (typeof sales_activity_type_id !== 'string' || sales_activity_type_id.length === 0) {
        return { disabled: true, options: [], placeholder: 'Select an activity type first.' };
      }
      try {
        const items = await fetchSelector({
          auth,
          path: `/api/selector/sales_activity_types/${encodeURIComponent(
            sales_activity_type_id
          )}/sales_activity_outcomes`,
        });
        return {
          disabled: false,
          options: items.map((item) => ({ label: item.name, value: item.id })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: error instanceof Error ? error.message : 'Could not load outcomes.',
        };
      }
    },
  });
}

function view() {
  return Property.Dropdown({
    auth: freshsalesAuth,
    displayName: 'View',
    description: 'Saved view to list; leave empty for the "All" view',
    required: false,
    refreshers: ['entity'],
    options: async ({ auth, entity }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your account first.' };
      }
      if (typeof entity !== 'string' || entity.length === 0) {
        return { disabled: true, options: [], placeholder: 'Select a record type first.' };
      }
      try {
        const items = await fetchSelector({
          auth,
          path: `/api/${encodeURIComponent(entity)}/filters`,
        });
        return {
          disabled: false,
          options: items.map((item) => ({ label: item.name, value: item.id })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: error instanceof Error ? error.message : 'Could not load views.',
        };
      }
    },
  });
}

function targetableType({ required }: { required: boolean }) {
  return Property.StaticDropdown({
    displayName: 'Related To',
    description: 'Type of the record this is linked to',
    required,
    options: { disabled: false, options: TARGETABLE_TYPES },
  });
}

function targetableId({ required }: { required: boolean }) {
  return Property.ShortText({
    displayName: 'Related Record ID',
    description: 'ID of the contact, account or deal',
    placeholder: '16000123456',
    required,
  });
}

function customFields() {
  return Property.Json({
    displayName: 'Custom Fields',
    description: 'Custom field values keyed by API name (cf_...)',
    required: false,
    defaultValue: {},
  });
}

async function findDefaultViewId({
  auth,
  entity,
}: {
  auth: FreshsalesAuthValue;
  entity: string;
}): Promise<string> {
  const items = await fetchSelector({ auth, path: `/api/${entity}/filters` });
  const systemName = DEFAULT_VIEW_NAMES[entity];
  const exact =
    systemName === undefined
      ? undefined
      : items.find((item) => item.name.trim().toLowerCase() === systemName.toLowerCase());
  const allView = exact ?? items.find((item) => /^all\b/i.test(item.name)) ?? items[0];
  if (!allView) {
    throw new Error(`No saved views found for ${entity}.`);
  }
  return allView.id;
}

export type SelectorItem = {
  id: string;
  name: string;
  email?: string;
  position?: number;
};

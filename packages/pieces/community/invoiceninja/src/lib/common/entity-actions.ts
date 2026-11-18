import { Property } from '@activepieces/pieces-framework';
import { invoiceNinjaClient } from './client';

function getIdProp(label: string) {
  return Property.ShortText({
    displayName: `${label} ID`,
    description: `The Invoice Ninja ID of the ${label.toLowerCase()} (letters and digits, e.g. VolejRejNm).`,
    required: true,
  });
}

function bulkIdProp(label: string) {
  return Property.ShortText({
    displayName: `${label} ID`,
    description: `The Invoice Ninja ID of the ${label.toLowerCase()}.`,
    required: true,
  });
}

async function runGet({ auth, entity, label, id }: RunGetInput) {
  const parsed = invoiceNinjaClient.parseId({ value: id, label: `${label} ID` });
  return invoiceNinjaClient.getRecord({ auth, entity, id: parsed });
}

async function runBulk({ auth, entity, label, action, id }: RunBulkInput) {
  const parsed = invoiceNinjaClient.parseId({ value: id, label: `${label} ID` });
  const record = await invoiceNinjaClient.bulk({ auth, entity, action, ids: [parsed] });
  if (Object.keys(record).length === 0) {
    throw new Error(`Invoice Ninja did not return the ${label.toLowerCase()} ${parsed}; it may not exist or the action does not apply to it.`);
  }
  return record;
}

function listProps() {
  return {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1. Default 1.',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Per Page',
      description: 'Results per page (1-100). Default 20.',
      required: false,
    }),
  };
}

function statusProp() {
  return Property.StaticDropdown<string>({
    displayName: 'Record State',
    description: 'Which records to include. Default: active only.',
    required: false,
    options: {
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
        { label: 'Deleted', value: 'deleted' },
        { label: 'Active and archived', value: 'active,archived' },
        { label: 'All', value: 'active,archived,deleted' },
      ],
    },
  });
}

function sortProp() {
  return Property.StaticDropdown<string>({
    displayName: 'Sort',
    description: 'Sort order. Default: Invoice Ninja default (newest first for most records).',
    required: false,
    options: {
      options: [
        { label: 'Newest first', value: 'created_at|desc' },
        { label: 'Oldest first', value: 'created_at|asc' },
        { label: 'Recently updated first', value: 'updated_at|desc' },
      ],
    },
  });
}

async function runList({ auth, entity, page, perPage, query }: RunListInput) {
  const paging = invoiceNinjaClient.paging({ page, perPage });
  return invoiceNinjaClient.listPage({ auth, entity, query, page: paging.page, perPage: paging.perPage });
}

export const entityActions = { getIdProp, bulkIdProp, runGet, runBulk, listProps, statusProp, sortProp, runList };

type RunGetInput = {
  auth: { base_url: string; access_token: string };
  entity: string;
  label: string;
  id: string;
};

type RunBulkInput = RunGetInput & { action: string };

type RunListInput = {
  auth: { base_url: string; access_token: string };
  entity: string;
  page: unknown;
  perPage: unknown;
  query: Record<string, string | number | boolean | undefined>;
};

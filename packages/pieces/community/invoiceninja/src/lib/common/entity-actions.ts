import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from './auth';
import { invoiceNinjaClient } from './client';

function getAction({ name, entity, label, aiDescription, outputSchema }: GetActionInput) {
  return createAction({
    auth: invoiceninjaAuth,
    name,
    classification: 'READ',
    displayName: `Get ${label}`,
    description: `Get one ${label.toLowerCase()} by its ID.`,
    audience: 'ai',
    aiMetadata: { description: aiDescription, idempotent: true },
    outputSchema,
    props: {
      id: Property.ShortText({
        displayName: `${label} ID`,
        description: `The Invoice Ninja ID of the ${label.toLowerCase()} (letters and digits, e.g. VolejRejNm).`,
        required: true,
      }),
    },
    async run({ auth, propsValue }) {
      const id = invoiceNinjaClient.parseId({ value: propsValue.id, label: `${label} ID` });
      return invoiceNinjaClient.getRecord({ auth: auth.props, entity, id });
    },
  });
}

function bulkAction({ name, entity, label, action, displayName, description, aiDescription, classification, idempotent, outputSchema }: BulkActionInput) {
  return createAction({
    auth: invoiceninjaAuth,
    name,
    classification,
    displayName,
    description,
    audience: 'ai',
    aiMetadata: { description: aiDescription, idempotent },
    outputSchema,
    props: {
      id: Property.ShortText({
        displayName: `${label} ID`,
        description: `The Invoice Ninja ID of the ${label.toLowerCase()}.`,
        required: true,
      }),
    },
    async run({ auth, propsValue }) {
      const id = invoiceNinjaClient.parseId({ value: propsValue.id, label: `${label} ID` });
      const record = await invoiceNinjaClient.bulk({ auth: auth.props, entity, action, ids: [id] });
      if (Object.keys(record).length === 0) {
        throw new Error(`Invoice Ninja did not return the ${label.toLowerCase()} ${id}; it may not exist or the action does not apply to it.`);
      }
      return record;
    },
  });
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

export const entityActions = { getAction, bulkAction, listProps, statusProp, sortProp, runList };

type GetActionInput = {
  name: string;
  entity: string;
  label: string;
  aiDescription: string;
  outputSchema: OutputSchema;
};

type BulkActionInput = {
  name: string;
  entity: string;
  label: string;
  action: string;
  displayName: string;
  description: string;
  aiDescription: string;
  classification: 'WRITE' | 'DESTRUCTIVE';
  idempotent: boolean;
  outputSchema: OutputSchema;
};

type RunListInput = {
  auth: { base_url: string; access_token: string };
  entity: string;
  page: unknown;
  perPage: unknown;
  query: Record<string, string | number | boolean | undefined>;
};

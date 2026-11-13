import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesRecords, RecordEntity } from '../common/records';
import { FILTER_OPERATORS } from '../common/props';
import { filteredSearchOutputSchema } from '../output-schemas';

export const filteredSearch = createAction({
  auth: freshsalesAuth,
  name: 'filtered_search',
  displayName: 'Filtered Search',
  description: 'Find contacts, accounts or deals matching field filters',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Finds contacts, accounts or deals whose fields match ALL given filters (exact value match, not free text). Each filter is attribute (API field name, e.g. first_name, job_title, contact_email.email, name, amount, created_at, or a cf_ custom field from Get Custom Fields), operator (is_in / is_not_in for values, is_after / is_before for dates) and value; comma-separate several values. An unknown attribute may be ignored by Freshsales, so check the names first. Use Search Records for a free-text name/email search and List Records in View for a saved view. Returns records, page, total and has_more; call again with Page + 1 while has_more is true.',
    idempotent: true,
  },
  outputSchema: filteredSearchOutputSchema,
  props: {
    entity: Property.StaticDropdown({
      displayName: 'Record Type',
      description: 'Which records to search',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Contacts', value: 'contact' },
          { label: 'Accounts', value: 'sales_account' },
          { label: 'Deals', value: 'deal' },
        ],
      },
    }),
    filters: Property.Array({
      displayName: 'Filters',
      description: 'All filters must match',
      required: true,
      properties: {
        attribute: Property.ShortText({
          displayName: 'Field',
          description: 'API field name, e.g. first_name or cf_plan',
          required: true,
        }),
        operator: Property.StaticDropdown({
          displayName: 'Operator',
          description: 'How to compare the field',
          required: true,
          defaultValue: 'is_in',
          options: { disabled: false, options: FILTER_OPERATORS },
        }),
        value: Property.ShortText({
          displayName: 'Value',
          description: 'Comma-separate several values; dates as YYYY-MM-DD',
          required: true,
        }),
      },
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1',
      required: false,
      defaultValue: 1,
    }),
    per_page: Property.Number({
      displayName: 'Per Page',
      description: 'Records per page (1-100)',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const entity = ENTITY_KEYS[String(context.propsValue.entity)];
    if (entity === undefined) {
      throw new Error('Record Type must be contact, sales_account or deal.');
    }
    const page = context.propsValue.page ?? 1;
    const perPage = context.propsValue.per_page ?? 25;
    if (!Number.isInteger(page) || page < 1) {
      throw new Error('Page must be a whole number of 1 or more.');
    }
    if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100) {
      throw new Error('Per Page must be a whole number between 1 and 100.');
    }
    const filterRule = context.propsValue.filters.map((filter, index) =>
      toFilterRule({ filter, position: index + 1 })
    );
    if (filterRule.length === 0) {
      throw new Error('Add at least one filter.');
    }
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/api/filtered_search/${entity.path}`,
      body: { filter_rule: filterRule, page, per_page: perPage },
    });
    const records = freshsalesClient
      .readArray({ body: response, key: entity.key })
      .filter((item) => freshsalesClient.isRecord(item))
      .map((record) => freshsalesRecords.shapeRecord({ entity: entity.key, record }));
    const meta = freshsalesClient.readMeta(response);
    const hasMore =
      meta.total !== undefined ? page * perPage < meta.total : records.length === perPage;
    return { records, page, total: meta.total ?? null, has_more: hasMore };
  },
});

const ENTITY_KEYS: Record<string, { path: string; key: RecordEntity } | undefined> = {
  contact: { path: 'contact', key: 'contacts' },
  sales_account: { path: 'sales_account', key: 'sales_accounts' },
  deal: { path: 'deal', key: 'deals' },
};

function toFilterRule({
  filter,
  position,
}: {
  filter: unknown;
  position: number;
}): { attribute: string; operator: string; value: unknown } {
  if (!freshsalesClient.isRecord(filter)) {
    throw new Error(`Filter ${position} must have Field, Operator and Value.`);
  }
  const attribute = String(filter['attribute'] ?? '').trim();
  const operator = String(filter['operator'] ?? '').trim();
  const raw = String(filter['value'] ?? '').trim();
  if (attribute.length === 0 || raw.length === 0) {
    throw new Error(`Filter ${position} needs a Field and a Value.`);
  }
  if (!FILTER_OPERATORS.some((option) => option.value === operator)) {
    throw new Error(
      `Filter ${position} operator must be one of: ${FILTER_OPERATORS.map((o) => o.value).join(', ')}.`
    );
  }
  if (operator === 'is_in' || operator === 'is_not_in') {
    const values = raw
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    return { attribute, operator, value: values.length === 1 ? values[0] : values };
  }
  const date = freshsalesClient.toIsoDate(raw);
  return { attribute, operator, value: date === undefined ? raw : date.slice(0, 10) };
}

import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { squareAuth } from '../auth';
import { squareClient } from '../common/client';
import { squareInputs } from '../common/inputs';
import { squareOps } from '../common/operations';
import { squareProps } from '../common/props';
import { squareShape } from '../common/shape';
import { squareOutputSchemas } from '../output-schemas';

export const findCustomersAction = createAction({
  name: 'find_customers',
  classification: 'SEARCH',
  auth: squareAuth,
  displayName: 'Find Customers',
  description: 'Searches customers by email, phone, reference ID or creation date.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches the Square Customer Directory by email, phone, reference ID and/or creation date and returns one page of matching customers with their IDs. Use it before Create Customer to avoid duplicates, or to get a customer ID for orders and payments. Square cannot search by name, and a customer created seconds ago may not be searchable yet. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    email_address: Property.ShortText({ displayName: 'Email', required: false }),
    phone_number: Property.ShortText({ displayName: 'Phone', description: 'For example +14155550123.', required: false }),
    reference_id: Property.ShortText({ displayName: 'Reference ID', required: false }),
    match: Property.StaticDropdown({
      displayName: 'Match',
      description: 'Exact match, or partial match (contains) for email, phone and reference ID.',
      required: false,
      defaultValue: 'exact',
      options: { options: [{ label: 'Exact', value: 'exact' }, { label: 'Partial', value: 'fuzzy' }] },
    }),
    created_after: Property.DateTime({ displayName: 'Created After', required: false }),
    created_before: Property.DateTime({ displayName: 'Created Before', required: false }),
    limit: squareProps.limitProp({ max: 100, fallback: 50 }),
    cursor: squareProps.cursorProp(),
  },
  outputSchema: squareOutputSchemas.customers,
  async run(context) {
    const p = context.propsValue;
    const mode = p.match === 'fuzzy' ? 'fuzzy' : 'exact';
    const term = (value: string | undefined) => (value === undefined ? undefined : { [mode]: value });
    const createdAfter = squareInputs.dateTime({ value: p.created_after, label: 'Created After' });
    const createdBefore = squareInputs.dateTime({ value: p.created_before, label: 'Created Before' });
    const filter = squareOps.dropUndefined({
      email_address: term(squareInputs.text(p.email_address)),
      phone_number: term(squareInputs.text(p.phone_number)),
      reference_id: term(squareInputs.text(p.reference_id)),
      created_at: createdAfter || createdBefore ? squareOps.dropUndefined({ start_at: createdAfter, end_at: createdBefore }) : undefined,
    });
    const body = await squareClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: ['v2', 'customers', 'search'],
      body: squareOps.dropUndefined({
        query: { ...(Object.keys(filter).length > 0 ? { filter } : {}), sort: { field: 'CREATED_AT', order: 'DESC' } },
        limit: squareInputs.limit({ value: p.limit, fallback: 50, max: 100 }),
        cursor: squareInputs.cursor(p.cursor),
      }),
      operation: 'search customers',
    });
    return squareShape.page({ items: squareShape.list({ value: body, key: 'customers' }).map(squareShape.customer), cursor: squareShape.str({ value: body, key: 'cursor' }) });
  },
});

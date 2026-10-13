import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { squareAuth } from '../auth';
import { squareClient } from '../common/client';
import { squareInputs } from '../common/inputs';
import { squareProps } from '../common/props';
import { squareShape } from '../common/shape';
import { squareOutputSchemas } from '../output-schemas';

export const listRefundsAction = createAction({
  name: 'list_refunds',
  classification: 'SEARCH',
  auth: squareAuth,
  displayName: 'List Refunds',
  description: 'Lists refunds in a time range, newest first.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Square refunds newest first, optionally by location ID, status and created-at range (ISO 8601). Returns one page; pass Next Cursor within about 5 minutes for more. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    location_id: Property.ShortText({ displayName: 'Location ID', description: 'Leave empty for all locations.', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: { options: ['PENDING', 'COMPLETED', 'REJECTED', 'FAILED'].map((value) => ({ label: value.charAt(0) + value.slice(1).toLowerCase(), value })) },
    }),
    begin_time: Property.DateTime({ displayName: 'Created After', required: false }),
    end_time: Property.DateTime({ displayName: 'Created Before', required: false }),
    limit: squareProps.limitProp({ max: 100, fallback: 50 }),
    cursor: squareProps.cursorProp(),
  },
  outputSchema: squareOutputSchemas.refunds,
  async run(context) {
    const p = context.propsValue;
    const body = await squareClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: ['v2', 'refunds'],
      query: {
        location_id: squareInputs.optionalId({ value: p.location_id, label: 'Location ID' }),
        status: squareInputs.text(p.status),
        begin_time: squareInputs.dateTime({ value: p.begin_time, label: 'Created After' }),
        end_time: squareInputs.dateTime({ value: p.end_time, label: 'Created Before' }),
        sort_order: 'DESC',
        limit: squareInputs.limit({ value: p.limit, fallback: 50, max: 100 }),
        cursor: squareInputs.cursor(p.cursor),
      },
      operation: 'list refunds',
    });
    return squareShape.page({ items: squareShape.list({ value: body, key: 'refunds' }).map(squareShape.refund), cursor: squareShape.str({ value: body, key: 'cursor' }) });
  },
});

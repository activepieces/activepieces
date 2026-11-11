import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaMarketing } from '../../common/marketing';
import { sallaOutputSchemas } from '../../common/output-schemas';

export const aiListAbandonedCartsAction = createAction({
  auth: sallaAuth,
  name: 'ai_list_abandoned_carts',
  classification: 'SEARCH',
  displayName: 'List Abandoned Carts',
  description: 'Lists carts customers left without checking out.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Salla abandoned carts, optionally only one customer\'s or filtered by Salla\'s offset in minutes ("carts created within or before an offset time", exact direction unconfirmed), returning each cart with its id, total, checkout link, customer contact and product IDs. Use it to find carts to follow up on; call Get Abandoned Cart for one cart by id. Read only, so it sends no reminder; returns at most max_results carts (cap 200) and truncated=true when more exist.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.abandonedCartList,
  props: {
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Customer ID or mobile number to match, for example 1209983424 or +966501234567. Leave empty for all carts.',
      required: false,
    }),
    older_than_minutes: Property.Number({
      displayName: 'Offset (minutes)',
      description: 'Sent to Salla as offset, a whole number of minutes, for example 60. Salla documents it as "carts created within or before an offset time"; the exact direction is unconfirmed. Leave empty for no offset filter.',
      required: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of carts to return, from 1 to 200, for example 20. Default 20.',
      required: false,
      defaultValue: 20,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaMarketing.listAbandonedCarts({
      auth,
      filters: {
        maxResults: clampMaxResults(propsValue.max_results),
        keyword: propsValue.keyword,
        olderThanMinutes: propsValue.older_than_minutes ?? undefined,
      },
    });
  },
});

function clampMaxResults(value: number | undefined | null): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return DEFAULT_MAX_RESULTS;
  }
  return Math.min(Math.max(Math.floor(value), 1), MAX_RESULTS_CAP);
}

const DEFAULT_MAX_RESULTS = 20;
const MAX_RESULTS_CAP = 200;

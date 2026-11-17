import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { AbandonedCartFilters, sallaMarketing } from '../common/marketing';
import { sallaOutputSchemas } from '../common/output-schemas';

export const findAbandonedCartsAction = createAction({
  auth: sallaAuth,
  name: 'find_abandoned_carts',
  classification: 'SEARCH',
  displayName: 'Find Abandoned Carts',
  description:
    'Lists carts that customers left without checking out, with the customer, total and checkout link. The Salla app needs the Abandoned Carts scope.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists Salla abandoned carts, optionally only one customer (by customer ID or mobile) or by Salla\'s offset filter in minutes ("carts created within or before an offset time"; the exact direction is unconfirmed), with the customer, items, total and checkout link. Use Get Abandoned Cart for one cart you already have the ID of. Read-only and safe to retry; Max Results caps the list (1 to 1000) and it needs the Abandoned Carts scope.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.abandonedCartList,
  propertyGroups: [
    {
      key: 'customer',
      display: 'builder',
      label: 'Customer',
      icon: 'user',
      props: ['keyword'],
    },
    {
      key: 'age',
      display: 'builder',
      label: 'Cart Age',
      icon: 'calendar',
      props: ['older_than_minutes'],
    },
    {
      key: 'footer',
      display: 'footer',
      icon: 'sliders',
      props: ['max_results'],
    },
  ],
  props: {
    keyword: Property.ShortText({
      displayName: 'Customer ID or Mobile',
      description: 'Only carts of this customer: the numeric customer ID, for example 1227534533, or the mobile with the country code, for example +966501234567.',
      placeholder: '+966501234567',
      icon: 'user',
      required: false,
    }),
    older_than_minutes: Property.Number({
      displayName: 'Offset (minutes)',
      description: 'Sent to Salla as offset, a whole number of minutes such as 60. Salla documents it as "carts created within or before an offset time"; the exact direction is unconfirmed, so check the results on a test before you rely on it.',
      placeholder: '60',
      icon: 'calendar',
      required: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Stop after this many carts, from 1 to 1000. Default 50.',
      display: 'stepper',
      min: 1,
      max: 1000,
      step: 1,
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    const filters: AbandonedCartFilters = {
      maxResults: clampMaxResults(propsValue.max_results),
      keyword: propsValue.keyword ?? undefined,
      olderThanMinutes: propsValue.older_than_minutes ?? undefined,
    };
    return sallaMarketing.listAbandonedCarts({ auth, filters });
  },
});

function clampMaxResults(value: number | undefined | null): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return DEFAULT_MAX_RESULTS;
  }
  return Math.min(Math.max(Math.floor(value), 1), MAX_RESULTS_LIMIT);
}

const DEFAULT_MAX_RESULTS = 50;
const MAX_RESULTS_LIMIT = 1000;

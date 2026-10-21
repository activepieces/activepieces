import { createAction, Property } from '@activepieces/pieces-framework';
import { sellToStateAuth } from '../common/auth';
import { SearchResult, stsGet } from '../common/client';

export const findSuppliers = createAction({
  auth: sellToStateAuth,
  name: 'find_suppliers',
  classification: 'SEARCH',
  displayName: 'Find Suppliers',
  description: 'Finds companies that won government contracts, by company name or by the subject of the contracts.',
  audience: 'both',
  aiMetadata: {
    description:
      'Find suppliers of government contracts. Match "Subject of won contracts" lists companies that won tenders about a product or service (competitor and incumbent research); match "Company name" finds one company. Use Get Supplier Profile on a result for detail. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    q: Property.ShortText({
      displayName: 'Text',
      description: 'A product or service (for example "cybersecurity"), or a company name.',
      required: true,
    }),
    match: Property.StaticDropdown({
      displayName: 'Match',
      required: true,
      defaultValue: 'awards',
      options: {
        options: [
          { label: 'Subject of won contracts', value: 'awards' },
          { label: 'Company name', value: 'name' },
        ],
      },
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country slug, or slugs separated by commas. Empty means all countries.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Results to return, 1 to 50.',
      required: false,
      defaultValue: 25,
    }),
  },
  async run({ auth, propsValue }) {
    const result = await stsGet<SearchResult>({
      apiKey: auth.secret_text,
      path: '/search',
      query: {
        scope: 'suppliers',
        q: propsValue.q,
        match: propsValue.match,
        country: propsValue.country,
        per_page: Math.min(Math.max(propsValue.limit ?? 25, 1), 50),
      },
    });
    return { found: result.found, suppliers: result.hits };
  },
});

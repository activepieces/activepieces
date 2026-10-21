import { createAction, Property } from '@activepieces/pieces-framework';
import { sellToStateAuth } from '../common/auth';
import { stsGet } from '../common/client';

const countryProp = Property.ShortText({
  displayName: 'Country',
  description: 'The country slug of the search result, for example "united-kingdom".',
  required: true,
});

export const getBuyerProfile = createAction({
  auth: sellToStateAuth,
  name: 'get_buyer_profile',
  classification: 'READ',
  displayName: 'Get Buyer Profile',
  description: 'Gets the profile of a government buyer: spend by year, sectors and top suppliers.',
  audience: 'both',
  aiMetadata: {
    description:
      'Get the procurement profile of one public buyer (agency, council, hospital, university) by its slug and country: spend by year, sectors and top suppliers. Get the slug from Search Tenders or a buyer search. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    slug: Property.ShortText({ displayName: 'Buyer Slug', required: true }),
    country: countryProp,
  },
  async run({ auth, propsValue }) {
    return stsGet<Record<string, unknown>>({
      apiKey: auth.secret_text,
      path: `/buyers/${encodeURIComponent(propsValue.slug)}`,
      query: { country: propsValue.country },
    });
  },
});

export const getSupplierProfile = createAction({
  auth: sellToStateAuth,
  name: 'get_supplier_profile',
  classification: 'READ',
  displayName: 'Get Supplier Profile',
  description: 'Gets the profile of a supplier: government awards by year, sectors and top buyers.',
  audience: 'both',
  aiMetadata: {
    description:
      'Get the public-contract profile of one supplier by its slug and country: awards by year, sectors and top buyers. Get the slug from Find Suppliers. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    slug: Property.ShortText({ displayName: 'Supplier Slug', required: true }),
    country: countryProp,
  },
  async run({ auth, propsValue }) {
    return stsGet<Record<string, unknown>>({
      apiKey: auth.secret_text,
      path: `/suppliers/${encodeURIComponent(propsValue.slug)}`,
      query: { country: propsValue.country },
    });
  },
});

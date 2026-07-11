import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  freshnessProp,
  maxCreditsProp,
  veezeeApiCall,
  veezeeAuth,
} from '../common';

export const getCompanyAction = createAction({
  name: 'get_company',
  displayName: 'Get Company',
  description:
    "Fetch a LinkedIn company page by URL, slug, or website domain. Costs 4 credits; a website domain is quoted at +4 credits for resolution, refunded at settlement when the domain is already known.",
  audience: 'both',
  aiMetadata: {
    description:
      "Fetch one company's LinkedIn page from Veezee: name, description, industry, employee count, headquarters, founding year, specialities, plus the URN and numeric id used as Search People company filters. Identifier accepts a company URL, the slug after /company/ (e.g. microsoft), or a website domain (e.g. microsoft.com); numeric ids and URNs are search-filter inputs, not fetch identifiers. This does not search by approximate name — use Search People's company filter or the exact slug. Costs 4 credits base; a domain identifier is quoted at +4 credits, refunded for already-known domains. Read-only lookup, safe to repeat.",
    idempotent: true,
  },
  auth: veezeeAuth,
  props: {
    identifier: Property.ShortText({
      displayName: 'Company Identifier',
      description:
        'Company URL (e.g. https://www.linkedin.com/company/microsoft), the slug after /company/ (e.g. microsoft), or a website domain (e.g. microsoft.com).',
      required: true,
    }),
    freshness: freshnessProp,
    max_credits: maxCreditsProp,
  },
  async run(context) {
    const { identifier, freshness, max_credits } = context.propsValue;

    return veezeeApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/companies',
      query: {
        identifier,
        freshness,
        max_credits,
      },
    });
  },
});

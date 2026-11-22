import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi, VILLAGE_ENRICH_MODE_OPTIONS } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const enrichCompany = createAction({
  auth: villageAuth,
  name: 'enrich_company',
  classification: 'READ',
  displayName: 'Enrich Company',
  description:
    'Get detailed information about a company by domain, LinkedIn URL, or any URL. Returns name, website, LinkedIn URL, logo, employee count, industry, founded year, and description.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read-only firmographic lookup for one company you can already identify by domain, LinkedIn URL, or generic url (supply exactly one). Use when you have the identifier; to find companies by criteria use Find Companies. Cost: free when Village has the company cached; a live fetch costs credits. Set mode to "cached_only" to never spend credits (a cache miss then returns not found). Read-only.',
    idempotent: true,
  },
  outputSchema: villageSchemas.enrichCompany,
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Company domain, e.g. "example.com" (provide one of: domain, linkedin_url, url)',
      required: false,
    }),
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn URL',
      description:
        'LinkedIn company page URL, e.g. "https://linkedin.com/company/acme-corp" (provide one of: domain, linkedin_url, url)',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description:
        'Generic company URL (auto-detected) (provide one of: domain, linkedin_url, url)',
      required: false,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Cache Mode',
      description:
        'cached_first (default) charges credits only when Village has to fetch live data; cached_only never charges and returns not found on a cache miss; realtime_only always fetches live and charges when found.',
      required: false,
      options: { options: VILLAGE_ENRICH_MODE_OPTIONS },
    }),
  },
  async run(context) {
    const { domain, linkedin_url, url, mode } = context.propsValue;

    const provided = [domain, linkedin_url, url].filter((value) => value !== undefined && value !== '');
    if (provided.length === 0) {
      throw new Error('Provide one of: domain, linkedin_url, url');
    }
    if (provided.length > 1) {
      throw new Error('Provide only one of: domain, linkedin_url, url');
    }

    const identifier: Record<string, string> = domain
      ? { domain }
      : linkedin_url
        ? { linkedin_url }
        : { url: url ?? '' };
    if (mode) {
      identifier['mode'] = mode;
    }

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/companies/enrich`,
      body: identifier,
    });
    return response;
  },
});

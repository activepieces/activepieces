import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const companiesRefresh = createAction({
  auth: villageAuth,
  name: 'companies_refresh',
  displayName: 'Refresh Companies',
  description:
    'Refresh/import company data from LinkedIn URLs or domains. Realtime mode returns enriched data synchronously (or times out after 25s); async mode returns job IDs for later status checking. At least one of linkedin_urls or domains must be provided.',
  audience: 'both',
  aiMetadata: {
    description:
      'Trigger a re-fetch or first-time import of companies from LinkedIn URLs and/or domains; it kicks off backend processing, so treat it as a non-idempotent write. Set realtime=true to wait up to ~25s for inline data, or false to get job IDs; pass those job_ids back on a later call to poll async results. To read an already-imported company without re-fetching, use Enrich Company.',
    idempotent: false,
  },
  props: {
    job_ids: Property.Array({
      displayName: 'Job IDs',
      description: 'Job IDs to check status for (returned by async refresh calls).',
      required: false,
    }),
    linkedin_urls: Property.Array({
      displayName: 'LinkedIn URLs',
      description: 'LinkedIn company page URLs to refresh.',
      required: false,
    }),
    domains: Property.Array({
      displayName: 'Domains',
      description: 'Company domains to refresh, e.g. "example.com".',
      required: false,
    }),
    realtime: Property.Checkbox({
      displayName: 'Realtime',
      description:
        'If true, wait for enrichment (up to ~25s) and return company data inline. If false, return job IDs immediately.',
      required: true,
    }),
  },
  async run(context) {
    const { linkedin_urls, domains, realtime, job_ids } = context.propsValue;

    const linkedinUrlsArray =
      linkedin_urls && Array.isArray(linkedin_urls) ? linkedin_urls.map((value) => String(value)) : [];
    const domainsArray =
      domains && Array.isArray(domains) ? domains.map((value) => String(value)) : [];
    const jobIdsArray =
      job_ids && Array.isArray(job_ids) ? job_ids.map((value) => String(value)) : [];

    if (linkedinUrlsArray.length === 0 && domainsArray.length === 0 && jobIdsArray.length === 0) {
      throw new Error('At least one of linkedin_urls, domains, or job_ids must be provided');
    }

    const body: Record<string, unknown> = { realtime };
    if (linkedinUrlsArray.length > 0) body['linkedin_urls'] = linkedinUrlsArray;
    if (domainsArray.length > 0) body['domains'] = domainsArray;
    if (jobIdsArray.length > 0) body['job_ids'] = jobIdsArray;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/companies/refresh`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body,
    });
    return response.body;
  },
});

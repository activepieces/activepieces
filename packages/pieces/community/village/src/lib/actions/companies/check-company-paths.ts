import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const checkCompanyPaths = createAction({
  auth: villageAuth,
  name: 'check_company_paths',
  classification: 'READ',
  displayName: 'Check Company Paths',
  description:
    'Quickly check if you have connections to a company without fetching full details. Returns whether paths exist, an overall score, count of reachable people, and avatar thumbnails.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read-only lightweight check of whether any introduction paths to a company exist, identified by domain, LinkedIn URL, or generic url (supply exactly one). Use as a cheap yes/no-with-score screen before calling Get Company Paths, which returns the actual reachable employees. Free. Pure query, safe to retry.',
    idempotent: true,
  },
  outputSchema: villageSchemas.checkCompanyPaths,
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Company domain, e.g. "acme.com" (provide one of: domain, linkedin_url, url)',
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
  },
  async run(context) {
    const { domain, linkedin_url, url } = context.propsValue;

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

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/companies/paths/check`,
      body: identifier,
    });
    return response;
  },
});

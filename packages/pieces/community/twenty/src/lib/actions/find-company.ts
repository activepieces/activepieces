import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { twentyAuth } from '../auth';
import { twentyRequest, parseRecords } from '../common';

export const findCompany = createAction({
  auth: twentyAuth,
  name: 'find_company',
  displayName: 'Find Company',
  description: 'Searches for company records in Twenty CRM.',
  audience: 'both',
  aiMetadata: { description: 'Looks up company records in Twenty CRM, optionally filtering by an exact-match company name and/or domain. Use to resolve a company to its record ID before updating or linking, or to check existence; leaving both filters empty returns all companies. Idempotent: a read-only query with no side effects.', idempotent: true },
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Filter by company name.',
      required: false,
    }),
    domainName: Property.ShortText({
      displayName: 'Domain Name',
      description: 'Filter by domain (e.g. acme.com).',
      required: false,
    }),
  },
  async run(context) {
    const { name, domainName } = context.propsValue;
    const queryParams: Record<string, string> = {};

    if (name) {
      queryParams['filter[name][eq]'] = name;
    }
    if (domainName) {
      queryParams['filter[domainName][primaryLinkUrl][eq]'] = domainName;
    }

    const body = await twentyRequest(
      context.auth,
      HttpMethod.GET,
      '/rest/companies',
      undefined,
      queryParams,
    );

    return parseRecords(body);
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const listNetworkCompanies = createAction({
  auth: villageAuth,
  name: 'list_network_companies',
  classification: 'SEARCH',
  displayName: 'List Network Companies',
  description: 'List companies where you have first-degree connections, strongest first. Free.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists companies the caller reaches through first-degree contacts, ranked by connection strength. Always free (first degree only). Returns flat rows with domain and LinkedIn URL; pass next_cursor for more. Use Find Companies for criteria-based discovery (costs credits).',
    idempotent: true,
  },
  outputSchema: villageSchemas.aiNetworkCompanies,
  props: {
    limit: Property.Number({ displayName: 'Limit', description: '1-50, default 25.', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'next_cursor from a previous call.', required: false }),
  },
  async run(context) {
    const { limit, cursor } = context.propsValue;
    const body: Record<string, unknown> = {
      connection_degrees: [1],
      limit: villageApi.clampLimit({ value: limit, max: 50, fallback: 25 }),
    };
    if (cursor) {
      body['cursor'] = cursor;
    }
    const response = await villageApi.call<ListCompaniesResponse>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v2/companies',
      body,
    });
    const companies = (response.data ?? []).map((company) => ({
      name: company.name ?? null,
      domain: company.domain_name ?? null,
      linkedin_url: company.linkedin_url ?? null,
      industry: company.industry ?? null,
      score_label: company.score_label ?? null,
    }));
    return {
      companies,
      found: companies.length > 0,
      next_cursor: response.pagination?.has_next_page ? response.pagination.cursor ?? null : null,
      has_more: response.pagination?.has_next_page ?? false,
    };
  },
});

type ListCompaniesResponse = {
  data?: { name?: string; domain_name?: string; linkedin_url?: string; industry?: string; score_label?: string }[];
  pagination?: { cursor?: string; has_next_page?: boolean };
};

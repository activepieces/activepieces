import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const findCompanies = createAction({
  auth: villageAuth,
  name: 'find_companies',
  classification: 'SEARCH',
  displayName: 'Find Companies',
  description: 'Find companies matching a plain-language description. Costs 2 Village credits per 10 results.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Natural-language company search (e.g. "B2B SaaS in California with 50-200 employees"). scope "network" (default) ranks companies the caller has paths into first; "global" searches all. Costs 2 credits per 10 results, max 10 per call. Returns flat rows with domain and LinkedIn URL (use the domain for Enrich Company or Check Company Paths). Pass next_cursor for the next page; each page is charged. credits_used and credits_left report the cost of this call and the remaining balance. For companies the caller already reaches, List Network Companies is free.',
    idempotent: true,
  },
  outputSchema: villageSchemas.aiFindCompanies,
  props: {
    prompt: Property.LongText({ displayName: 'Description', description: 'Which companies to find.', required: true }),
    scope: Property.StaticDropdown({
      displayName: 'Scope',
      required: false,
      defaultValue: 'network',
      options: {
        options: [
          { label: 'My network first', value: 'network' },
          { label: 'Everyone', value: 'global' },
        ],
      },
    }),
    limit: Property.Number({ displayName: 'Limit', description: '1-10, default 10.', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'next_cursor from a previous call.', required: false }),
  },
  async run(context) {
    const { prompt, scope, limit, cursor } = context.propsValue;
    const body: Record<string, unknown> = {
      prompt: villageApi.requireText({ value: prompt, field: 'Description' }),
      scope: scope === 'global' ? 'global' : 'network',
      limit: villageApi.clampLimit({ value: limit, max: 10, fallback: 10 }),
    };
    if (cursor) {
      body['cursor'] = cursor;
    }
    const response = await villageApi.call<SearchCompaniesResponse>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v2/companies/search',
      body,
    });
    const companies = (response.data ?? []).map((company) => ({
      id: company.id ?? null,
      name: company.name ?? null,
      domain: company.domain ?? null,
      linkedin_url: company.linkedin_url ?? null,
      industry: company.industry ?? null,
    }));
    return {
      companies,
      found: companies.length > 0,
      next_cursor: response.pagination?.has_next_page ? response.pagination.cursor ?? null : null,
      has_more: response.pagination?.has_next_page ?? false,
      credits_used: response.metadata?.credits_used ?? null,
      credits_left: response.metadata?.credits_left ?? null,
    };
  },
});

type SearchCompaniesResponse = {
  data?: { id?: string; name?: string; domain?: string; linkedin_url?: string; industry?: string }[];
  pagination?: { cursor?: string; has_next_page?: boolean };
  metadata?: { credits_used?: number; credits_left?: number };
};

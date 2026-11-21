import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

import { ApiMember } from '../common/client';

export const searchMembers = createAction({
  auth: mailchimpAuth,
  name: 'search_members',
  classification: 'SEARCH',
  displayName: 'Search Members',
  description: 'Search members by email, first name or last name across all audiences or within one audience.',
  audience: 'both',
  aiMetadata: {
    description: 'Fuzzy search for audience members by a full or partial email, first name or last name, across every audience or within one list_id. Returns exact matches and other (partial) matches separately, up to 10 each as Mailchimp limits it. To fetch one known email in a known list use Get Member instead. Read-only.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['searchMembers'],
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Full or partial email address, first name or last name.',
      required: true,
    }),
    list_id: mailchimpCommon.mailChimpOptionalListIdDropdown,
  },
  async run(context) {
    const query = mailchimpApi.requireText({ value: context.propsValue.query, label: 'Search Query' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const body = await client.request<SearchResponse>({
      method: HttpMethod.GET,
      path: '/search-members',
      queryParams: { query, list_id: mailchimpApi.optionalText(context.propsValue.list_id) },
      operation: 'search members',
    });
    return {
      exact_matches: (body.exact_matches?.members ?? []).map((member) => mailchimpApi.toMemberSummary(member)),
      full_search: (body.full_search?.members ?? []).map((member) => mailchimpApi.toMemberSummary(member)),
      exact_total: body.exact_matches?.total_items ?? 0,
      full_total: body.full_search?.total_items ?? 0,
    };
  },
});

type SearchResponse = {
  exact_matches?: { members?: ApiMember[]; total_items?: number };
  full_search?: { members?: ApiMember[]; total_items?: number };
};

import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const listNetworkPeople = createAction({
  auth: villageAuth,
  name: 'list_network_people',
  classification: 'SEARCH',
  displayName: 'List Network People',
  description: 'List people you are directly connected to (first degree), strongest connections first. Free.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the caller\'s first-degree contacts ranked by connection strength, optionally only those currently at one company domain. Always free (first degree only). Returns flat rows with LinkedIn URL and identifier; pass next_cursor for more. Use Find People to discover people the caller does not know (costs credits).',
    idempotent: true,
  },
  outputSchema: villageSchemas.aiNetworkPeople,
  props: {
    company_domain: Property.ShortText({
      displayName: 'Company Domain',
      description: 'Only people currently at this domain, e.g. stripe.com.',
      required: false,
    }),
    limit: Property.Number({ displayName: 'Limit', description: '1-50, default 25.', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'next_cursor from a previous call.', required: false }),
  },
  async run(context) {
    const { company_domain, limit, cursor } = context.propsValue;
    const body: Record<string, unknown> = {
      connection_degrees: [1],
      limit: villageApi.clampLimit({ value: limit, max: 50, fallback: 25 }),
    };
    if (cursor) {
      body['cursor'] = cursor;
    }
    if (company_domain && company_domain.trim().length > 0) {
      body['company_domain'] = company_domain.trim();
    }
    const response = await villageApi.call<ListPeopleResponse>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v2/people',
      body,
    });
    const people = (response.data ?? []).map((person) => ({
      linkedin_identifier: person.linkedin_identifier ?? null,
      name: person.full_name ?? null,
      headline: person.headline ?? null,
      title: person.work_relevant?.title ?? null,
      linkedin_url: person.linkedin_url ?? null,
      score_label: person.score_label ?? null,
    }));
    return {
      people,
      found: people.length > 0,
      next_cursor: response.pagination?.has_next_page ? response.pagination.cursor ?? null : null,
      has_more: response.pagination?.has_next_page ?? false,
    };
  },
});

type ListPeopleResponse = {
  data?: {
    linkedin_identifier?: string;
    full_name?: string;
    headline?: string;
    linkedin_url?: string;
    score_label?: string;
    work_relevant?: { title?: string };
  }[];
  pagination?: { cursor?: string; has_next_page?: boolean };
};

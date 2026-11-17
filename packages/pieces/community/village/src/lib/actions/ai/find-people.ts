import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const findPeople = createAction({
  auth: villageAuth,
  name: 'find_people',
  classification: 'SEARCH',
  displayName: 'Find People',
  description: 'Find people matching a plain-language description. Costs 2 Village credits per 10 results.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Natural-language people search (e.g. "CTOs at fintech startups in Berlin"). scope "network" (default) searches the caller\'s network first; "global" searches everyone. Costs 2 credits per 10 results returned, so keep limit small (max 10). Returns flat rows with the Village person ID (use it for Add Lead to Sequence) and LinkedIn URL (use it for Enrich Person, Get Person Paths, Add Person to List). Pass next_cursor to get the next page; each page is charged. credits_used and credits_left report the cost of this call and the remaining balance. For people the caller already knows, List Network People is free.',
    idempotent: true,
  },
  outputSchema: villageSchemas.aiFindPeople,
  props: {
    prompt: Property.LongText({
      displayName: 'Description',
      description: 'Who to find, in plain language.',
      required: true,
    }),
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
    const response = await villageApi.call<SearchPeopleResponse>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v2/people/search',
      body,
    });
    const people = (response.data ?? []).map((person) => ({
      id: person.id === undefined || person.id === null ? null : String(person.id),
      name: person.full_name ?? null,
      headline: person.headline ?? null,
      title: person.work_relevant?.title ?? null,
      company: villageApi.companyName(person.work_relevant?.company),
      linkedin_url: person.linkedin_url ?? null,
    }));
    return {
      people,
      found: people.length > 0,
      next_cursor: response.pagination?.has_next_page ? response.pagination.cursor ?? null : null,
      has_more: response.pagination?.has_next_page ?? false,
      credits_used: response.metadata?.credits_used ?? null,
      credits_left: response.metadata?.credits_left ?? null,
    };
  },
});

type SearchPeopleResponse = {
  data?: {
    id?: number | string | null;
    full_name?: string;
    headline?: string;
    linkedin_url?: string;
    work_relevant?: { title?: string; company?: unknown };
  }[];
  pagination?: { cursor?: string; has_next_page?: boolean };
  metadata?: { credits_used?: number; credits_left?: number };
};

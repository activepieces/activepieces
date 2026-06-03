import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../..';

export const posthogListPersons = createAction({
  auth: posthogAuth,
  name: 'list_persons',
  displayName: 'List Persons',
  description: 'Get a list of identified users in your PostHog project',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of persons to return (default: 100)',
      required: false,
      defaultValue: 100,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Filter persons by email or name',
      required: false,
    }),
  },
  async run(context) {
    const { personal_api_key, project_id, api_host } = context.auth.props;
    const apiBase = api_host || 'https://us.posthog.com';

    const queryParams: Record<string, string> = {
      limit: String(context.propsValue.limit ?? 100),
    };
    if (context.propsValue.search) {
      queryParams['search'] = context.propsValue.search;
    }

    const result = await httpClient.sendRequest<PersonsResponse>({
      method: HttpMethod.GET,
      url: `${apiBase}/api/projects/${project_id}/persons/`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: personal_api_key,
      },
      queryParams,
    });

    return (result.body.results ?? []).map((person) => ({
      id: person.id,
      uuid: person.uuid,
      distinct_ids: Array.isArray(person.distinct_ids) ? person.distinct_ids.join(', ') : null,
      name: person.name ?? null,
      email: (person.properties?.['email'] as string) ?? null,
      created_at: person.created_at,
      updated_at: person.updated_at ?? null,
    }));
  },
});

type Person = {
  id: number;
  uuid: string;
  distinct_ids: string[];
  name?: string;
  created_at: string;
  updated_at?: string;
  properties: Record<string, unknown>;
};

type PersonsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Person[];
};

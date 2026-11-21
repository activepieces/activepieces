import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const sortPeople = createAction({
  auth: villageAuth,
  name: 'sort_people',
  classification: 'READ',
  displayName: 'Sort People',
  description:
    'Rank a list of LinkedIn profile URLs by how well-connected you are to them. Returns each person sorted by connection strength (highest first), with score (0-100) and score_label.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read-only ranking of a caller-supplied set of people (LinkedIn profile URLs) by how strongly you are connected to each, ordered strongest-first. Use when you already have specific candidates and want them prioritized; to discover candidates use Find People. Free. Pure query, safe to retry.',
    idempotent: true,
  },
  outputSchema: villageSchemas.sortPeople,
  props: {
    people: Property.Array({
      displayName: 'People',
      description:
        'Array of LinkedIn person profile URLs (e.g. https://linkedin.com/in/johndoe). At least one is required.',
      required: true,
      defaultValue: [],
    }),
  },
  async run(context) {
    const { people } = context.propsValue;

    if (!Array.isArray(people) || people.length === 0) {
      throw new Error('At least one person URL is required.');
    }

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/people/sort`,
      body: { people: people.map(String) },
    });
    return response;
  },
});

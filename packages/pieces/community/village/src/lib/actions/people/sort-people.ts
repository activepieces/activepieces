import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const sortPeople = createAction({
  auth: villageAuth,
  name: 'sort_people',
  displayName: 'Sort People',
  description:
    'Rank a list of LinkedIn profile URLs by how well-connected you are to them. Returns each person sorted by connection strength (highest first), with score (0-100) and score_label.',
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

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/people/sort`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body: { people: people.map(String) },
    });
    return response.body;
  },
});

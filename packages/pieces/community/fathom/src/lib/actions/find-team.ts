import { createAction, Property } from '@activepieces/pieces-framework';
import { fathomAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const listTeams = createAction({
  auth: fathomAuth,
  name: 'list-teams',
  displayName: 'List Teams',
  description: 'Retrieves a paginated list of all teams in your Fathom account',
  props: {
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor for pagination (from previous response)',
      required: false,
    }),
  },
  async run(context) {
    const { cursor } = context.propsValue;

    // Build path with cursor if provided
    const path = cursor ? `/teams?cursor=${encodeURIComponent(cursor)}` : '/teams';

    const response = await makeRequest(
      context.auth as string,
      HttpMethod.GET,
      path
    );

    return response;
  },
});

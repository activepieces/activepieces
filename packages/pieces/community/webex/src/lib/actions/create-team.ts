import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const createTeam = createAction({
  name: 'createTeam',
  displayName: 'Create Team',
  description:
    'Create a new Webex team. The authenticated user is automatically added as a member.',
  props: {
    name: Property.ShortText({
      displayName: 'Team Name',
      description: 'A user-friendly name for the team',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the team (optional)',
      required: false,
    }),
  },
  async run(context) {
    const name = context.propsValue.name as string;
    const description = context.propsValue.description as string | undefined;

    const body: Record<string, unknown> = {
      name,
    };

    if (description) {
      body['description'] = description;
    }

    const response = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      '/teams',
      body
    );

    return response;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { synkraChatAuth } from '../auth';
import { synkraChatRequest } from '../common/client';

export const createTeamAction = createAction({
  auth: synkraChatAuth,
  name: 'create_team',
  displayName: 'Create Team',
  description: 'Create a new team of agents.',
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    description: Property.ShortText({ displayName: 'Description', required: false }),
    allow_auto_assign: Property.Checkbox({
      displayName: 'Allow auto assign',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    return synkraChatRequest({
      auth: auth.props,
      method: HttpMethod.POST,
      path: '/teams',
      body: {
        name: propsValue.name,
        description: propsValue.description ?? '',
        allow_auto_assign: propsValue.allow_auto_assign ?? false,
      },
    });
  },
});

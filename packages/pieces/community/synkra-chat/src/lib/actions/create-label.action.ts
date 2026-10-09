import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { synkraChatAuth } from '../auth';
import { synkraChatRequest } from '../common/client';

export const createLabelAction = createAction({
  auth: synkraChatAuth,
  name: 'create_label',
  displayName: 'Create Label',
  description: 'Create a new label for tagging contacts and conversations.',
  props: {
    title: Property.ShortText({ displayName: 'Title', required: true }),
    description: Property.ShortText({ displayName: 'Description', required: false }),
    color: Property.ShortText({
      displayName: 'Colour',
      description: 'Hex colour code, for example #5DD62C.',
      required: false,
      defaultValue: '#5DD62C',
    }),
  },
  async run({ auth, propsValue }) {
    return synkraChatRequest({
      auth: auth.props,
      method: HttpMethod.POST,
      path: '/labels',
      body: {
        title: propsValue.title,
        description: propsValue.description ?? '',
        color: propsValue.color ?? '#5DD62C',
      },
    });
  },
});

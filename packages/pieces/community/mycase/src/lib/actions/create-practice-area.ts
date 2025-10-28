import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';

export const createPracticeArea = createAction({
  auth: myCaseAuth,
  name: 'createPracticeArea',
  displayName: 'Create Practice Area',
  description: 'Creates a new practice area',
  props: {
    name: Property.ShortText({
      displayName: 'Practice Area Name',
      description: 'The name of the practice area',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const payload = {
      name: propsValue.name,
    };

    return await myCaseApiService.createPracticeArea({
      accessToken: auth.access_token,
      payload,
    });
  },
});

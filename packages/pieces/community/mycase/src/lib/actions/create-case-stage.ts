import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';

export const createCaseStage = createAction({
  auth: myCaseAuth,
  name: 'createCaseStage',
  displayName: 'Create Case Stage',
  description: 'Creates a new case stage',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description:
        'The name of the case. The case name gets validated so it must be unique.',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    return await myCaseApiService.createCaseStage({
      accessToken: context.auth.access_token,
      payload: {
        name,
      },
    });
  },
});

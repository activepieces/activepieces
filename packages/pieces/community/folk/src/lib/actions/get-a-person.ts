import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getPerson = createAction({
  auth: folkAuth,
  name: 'get-a-person',
  displayName: 'Get a Person',
  description: 'Retrieve an existing person in the workspace',
  props: {
    personId: Property.ShortText({
      displayName: 'Person ID',
      description: 'The ID of the person to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { personId } = context.propsValue;

    // Make the API call
    const response = await folkApiCall({
      apiKey: context.auth,
      method: HttpMethod.GET,
      endpoint: `/people/${personId}`,
    });

    return response;
  },
});

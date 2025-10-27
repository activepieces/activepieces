import { createAction, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, FolkPerson, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getPersonAction = createAction({
  auth: folkAuth,
  name: 'get_person',
  displayName: 'Get a Person',
  description: 'Retrieves a person by contact ID',
  props: {
    personId: Property.ShortText({
      displayName: 'Person ID',
      description: 'ID of the person to retrieve',
      required: true,
    }),
  },
  async run(context) {
    try {
      const response = await makeFolkRequest<{ data: FolkPerson }>(
        context.auth,
        HttpMethod.GET,
        `/people/${context.propsValue.personId}`
      );

      return {
        success: true,
        person: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Person not found',
      };
    }
  },
});
import { meistertaskAuth } from '../../index';
import { meisterTaskCommon } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const findPerson = createAction({
  auth: meistertaskAuth,
  name: 'find_person',
  displayName: 'Find Person',
  description: 'Finds a person based on person_id',
  props: {
    person_id: Property.ShortText({
      displayName: 'Person ID',
      required: true,
    }),
  },
  
  async run(context) {
    const { person_id } = context.propsValue;
    
    return await meisterTaskCommon.makeRequest(
      HttpMethod.GET,
      `/persons/${person_id}`,
      context.auth.access_token
    );
  },
});
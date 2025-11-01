import { createAction, Property } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { personDropdown } from '../common/props';
import { meisterTaskApiService } from '../common/requests';

export const findPerson = createAction({
  auth: meisterTaskAuth,
  name: 'findPerson',
  displayName: 'Find Person',
  description: 'Finds a person based on person_id',
  props: {
    personId: personDropdown({
      displayName: 'Select a person',
      description: 'The person you to want find',
      required: true,
    }),
  },
  async run(context) {
    return await meisterTaskApiService.fetchPersonById({
      auth: context.auth,
      personId: context.propsValue.personId,
    });
  },
});

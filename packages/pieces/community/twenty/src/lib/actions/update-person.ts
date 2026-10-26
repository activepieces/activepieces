import { createAction, Property } from '@activepieces/pieces-framework';
import { twentyAuth } from '../auth';
import { twentyApi } from '../common/api';
import { updatePersonOutputSchema } from '../output-schemas';

export const updatePersonAction = createAction({
  auth: twentyAuth,
  name: 'update_person',
  outputSchema: updatePersonOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Person',
  description: 'Updates an existing person record in Twenty CRM.',
  audience: 'human',
  aiMetadata: { description: 'Updates an existing person in Twenty CRM, identified by the required person ID (resolve it first with Find Person). Patches only the supplied first name, last name, and/or email, merging name changes with the current record; if no fields are given it simply returns the current record. Idempotent: targets a fixed ID and re-applying the same field values leaves the record unchanged.', idempotent: true },
  props: {
    personId: Property.ShortText({
      displayName: 'Person ID',
      description: 'The ID of the person to update. Use the "Find Person" action to look this up.',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
  },
  async run(context) {
    const { personId, firstName, lastName, email } = context.propsValue;

    return await twentyApi.updatePerson({
      auth: context.auth,
      personId,
      firstName,
      lastName,
      email,
    });
  },
});

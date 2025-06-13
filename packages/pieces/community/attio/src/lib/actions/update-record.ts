import { attioAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { attioApiService } from '../common/request';

export const updateRecord = createAction({
  auth: attioAuth,
  name: 'updateRecord',
  displayName: 'Update Record',
  description: 'Updates a record in attio',
  props: {
    object: Property.ShortText({
      displayName: 'Object',
      description:
        'The UUID or slug identifying the object the record belongs to (e.g., people, companies)',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The UUID of the record to update',
      required: true,
    }),
    values: Property.Object({
      displayName: 'Values',
      description:
        'An object with attribute API slugs or IDs as keys and their values. For multiselect attributes, values will be appended to existing ones.',
      required: true,
    }),
    emailAddress: Property.ShortText({
      displayName: 'Email Address',
      description:
        'Enter the email address of the person you want to add as a record',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description:
        'Enter the first name of the person you want to add as a record',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'last Name',
      description:
        'Enter the last name of the person you want to add as a record',
      required: true,
    }),
  },
  async run(context) {
    const { object, recordId, values, emailAddress, firstName, lastName } = context.propsValue;

    return await attioApiService.updateRecord({
      auth: context.auth,
      recordId,
      object,
      payload: {
        values: {
          ...values,
          email_addresses: [emailAddress],
          name: [
            {
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`,
            },
          ],
        },
      },
    });
  },
});

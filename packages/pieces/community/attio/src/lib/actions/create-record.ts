import { attioAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { attioApiService } from '../common/request';

export const createRecord = createAction({
  auth: attioAuth,
  name: 'createRecord',
  displayName: 'Create Record',
  description: 'Creates a new record in attio',
  props: {
    object: Property.ShortText({
      displayName: 'Object',
      description:
        'The UUID or slug identifying the object the created record should belong to (e.g., people, companies)',
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
    values: Property.Object({
      displayName: 'Values',
      description:
        'An object with attribute API slugs or IDs as keys and their values. For multi-select attributes, use arrays of values.',
      required: false,
      defaultValue: [],
    }),
  },
  async run(context) {
    const { object, values, emailAddress, firstName, lastName } =
      context.propsValue;

    return await attioApiService.createRecord({
      auth: context.auth,
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

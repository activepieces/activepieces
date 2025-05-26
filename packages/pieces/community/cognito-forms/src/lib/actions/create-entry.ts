import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createEntry = createAction({
  name: 'createEntry',
  displayName: 'Create Entry',
  description: 'Create a new entry in a Cognito Form',
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form to create an entry in',
      required: true,
    }),
    entryData: Property.Object({
      displayName: 'Entry Data',
      description: 'The data to submit for the entry. This should match your form fields.',
      required: true,
    }),
    action: Property.StaticDropdown({
      displayName: 'Action',
      description: 'The action to perform on the entry',
      required: true,
      options: {
        options: [
          { label: 'Submit', value: 'Submit' },
          { label: 'Update', value: 'Update' }
        ]
      },
      defaultValue: 'Submit'
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'The role for the entry',
      required: true,
      options: {
        options: [
          { label: 'Public', value: 'Public' },
          { label: 'Internal', value: 'Internal' },
          { label: 'Reviewer', value: 'Reviewer' }
        ]
      },
      defaultValue: 'Public'
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the entry',
      required: true,
      options: {
        options: [
          { label: 'Incomplete', value: 'Incomplete' },
          { label: 'Submitted', value: 'Submitted' },
          { label: 'Reviewed', value: 'Reviewed' },
          { label: 'Complete', value: 'Complete' }
        ]
      },
      defaultValue: 'Submitted'
    }),
    billingAddress: Property.Json({
      displayName: 'Billing Address',
      description: 'The billing address for the entry',
      required: false,
    }),
    billingName: Property.Json({
      displayName: 'Billing Name',
      description: 'The billing name for the entry',
      required: false,
    })
  },
  async run(context) {
    const { formId, entryData, action, role, status, billingAddress, billingName } = context.propsValue;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://www.cognitoforms.com/api/forms/${formId}/entries`,
      body: {
        ...entryData,
        Action: action,
        Role: role,
        Status: status,
        BillingAddress: billingAddress,
        BillingName: billingName
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.auth}`
      },
    });

    return response.body;
  },
});

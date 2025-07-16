import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../common/auth';

export const updateCustomerProperties = createAction({
  name: 'update_customer_properties',
  displayName: 'Update Customer Properties',
  description: 'Modify fields and custom attributes for an existing customer.',
  auth: helpScoutAuth,
  props: {
    customerId: Property.Number({
      displayName: 'Customer ID',
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
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      required: false,
    }),
    background: Property.LongText({
      displayName: 'Background',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields (object)',
      required: false,
      description: 'Key-value pairs for custom fields, e.g. { "fieldId": "value" }',
    }),
  },
  async run({ auth, propsValue }) {
    const body: any = {};
    if (propsValue['firstName']) body.firstName = propsValue['firstName'];
    if (propsValue['lastName']) body.lastName = propsValue['lastName'];
    if (propsValue['jobTitle']) body.jobTitle = propsValue['jobTitle'];
    if (propsValue['location']) body.location = propsValue['location'];
    if (propsValue['background']) body.background = propsValue['background'];
    if (propsValue['customFields']) body.customFields = propsValue['customFields'];
    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `https://api.helpscout.net/v2/customers/${propsValue['customerId']}`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  },
}); 
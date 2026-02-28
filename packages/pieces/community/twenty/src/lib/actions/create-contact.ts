import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { twentyAuth } from '../auth';

export const createContact = createAction({
  auth: twentyAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Creates a new person record in your Twenty CRM workspace.',
  props: {
    
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true,
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
    // 1. Get the auth object
    const auth = context.auth as any;

    // 2. Extract values with fallbacks to handle framework nesting
    const baseUrl = auth?.props.base_url || "";
    const apiKey = auth?.props.api_key || "";

    if (!baseUrl || !apiKey) {
        throw new Error("Connection data is missing. Please try deleting and recreating your Twenty connection.");
    }

   const sanitizedUrl = baseUrl.replace(/\/$/, '');
   
    const { firstName, lastName, email } = context?.propsValue;

    const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${sanitizedUrl}/rest/people`,
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: {
          name: {
            firstName,
            lastName
          },
            emails: email ? { primaryEmail: email } : undefined,
        },
    });

    return response.body;
},
});
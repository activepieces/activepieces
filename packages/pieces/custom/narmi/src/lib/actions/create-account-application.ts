import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { narmiAuth } from '../..';

export const createAccountApplication = createAction({
  name: 'create_account_application',
  auth: narmiAuth,
  displayName: 'Create Account Application',
  description: 'Create a new account application',
  props: {
    csrfToken: Property.ShortText({
      displayName: 'CSRF Token',
      description: 'CSRF token obtained from GET /csrf endpoint',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address for the applicant',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the applicant',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the applicant',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number',
      required: false,
    }),
    selectedProducts: Property.Array({
      displayName: 'Selected Products',
      description: 'Array of product IDs to apply for',
      required: false,
    }),
    additionalData: Property.Json({
      displayName: 'Additional Data',
      description: 'Additional application data as JSON',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const {
      csrfToken,
      email,
      firstName,
      lastName,
      phone,
      selectedProducts,
      additionalData,
    } = context.propsValue;

    const body: any = {
      email,
      ...(additionalData || {}),
    };

    if (firstName || lastName) {
      body.applicants = [
        {
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
        },
      ];
    }

    if (selectedProducts) {
      body.selected_products = selectedProducts;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/v1/account_opening/`,
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRFTOKEN': csrfToken,
      },
      body,
    });

    return response.body;
  },
});

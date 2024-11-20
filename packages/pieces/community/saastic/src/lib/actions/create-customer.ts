import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
  HttpRequest,
  propsValidation,
} from '@activepieces/pieces-common';
import { z } from 'zod';
import { saasticCommon } from '../common';
import { saasticAuth } from '../..';

export const createCustomer = createAction({
  auth: saasticAuth,
  name: 'create_customer',
  displayName: 'Create or Update a Customer',
  description: 'Create or update a customer.',

  props: {
    first_name: Property.LongText({
      displayName: 'First Name',
      description: "The customer's first name.",
      required: true,
    }),
    last_name: Property.LongText({
      displayName: 'Last Name',
      description: "The customer's last name.", 
      required: true,
    }),
    email: Property.LongText({
      displayName: 'Email',
      description: "The customer's email address.",
      required: true,
    }),
    phone: Property.LongText({
      displayName: 'Phone',
      description: "The customer's phone number. Ex: +15555555555",
      required: false,
    }),
    signed_up_at: Property.DateTime({
      displayName: 'Signup Date',
      description: 'The date the customer signed up.',
      required: false,
    }),
  },

  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      email: z.string().email(),
      signed_up_at: z.string().datetime().optional(),
    });

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${saasticCommon.baseUrl}/customers`,
      body: {
        first_name: context.propsValue.first_name || '',
        last_name: context.propsValue.last_name || '',
        email: context.propsValue.email || '',
        phone: context.propsValue.phone || '',
        signed_up_at: context.propsValue.signed_up_at || '',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      queryParams: {},
    };
    await httpClient.sendRequest(request);

    return {
      success: true,
    };
  },
});

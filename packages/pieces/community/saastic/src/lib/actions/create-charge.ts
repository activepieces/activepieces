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

export const createCharge = createAction({
  auth: saasticAuth,
  name: 'create_charge',
  displayName: 'Create a Customer Charge',
  description: 'Creates a customer charge.',

  props: {
    email: Property.LongText({
      displayName: 'Email',
      description: "The customer's email address.",
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The amount charged in the smallest currency unit.',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'The ISO currency code.',
      required: false,
      defaultValue: 'USD',
    }),
    charged_at: Property.DateTime({
      displayName: 'Charge date',
      description: 'The date the customer was charged.',
      required: false,
    }),
  },

  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      email: z.string().email(),
    });

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${saasticCommon.baseUrl}/charges`,
      body: {
        email: context.propsValue.email || '',
        amount: context.propsValue.amount || '',
        currency: context.propsValue.currency || '',
        charged_at: context.propsValue.charged_at || '',
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

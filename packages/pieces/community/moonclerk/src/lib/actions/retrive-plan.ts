import { createAction, Property } from '@activepieces/pieces-framework';
import { moonclerkAuth } from '../common/auth';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
export const retrivePlan = createAction({
  auth: moonclerkAuth,
  name: 'retrivePlan',
  displayName: 'Retrieve Plan',
  description: 'Retrieve a customer plan from MoonClerk using the customer ID',
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The ID of the customer to retrieve the plan for',
      required: true,
    }),
  },
  async run(context) {
    const { customerId } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.moonclerk.com/customers/${customerId}`,
      headers: {
        Authorization: `Token token=${apiKey}`,
        Accept: 'application/vnd.moonclerk+json;version=1',
      },
    });

    const plan = response.body.customer?.subscription?.plan;

    return plan;
  },
});

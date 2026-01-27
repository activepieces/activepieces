import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { katanaAuth } from '../common/auth';
import { BASE_URL } from '../common/constants';

export const findCustomer = createAction({
  auth: katanaAuth,
  name: 'find_customer',
  displayName: 'Find Customer',
  description: 'Find a customer by name, email, or phone number.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Filters customers by name.',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Filters customers by first name.',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Filters customers by last name.',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Filters customers by company.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Filters customers by email.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Filters customers by phone number.',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Filters customers by currency.',
      required: false,
    }),
    reference_id: Property.ShortText({
      displayName: 'Reference ID',
      description: 'Filters customers by reference ID.',
      required: false,
    }),
    category: Property.ShortText({
      displayName: 'Category',
      description: 'Filters customers by category.',
      required: false,
    }),
    include_deleted: Property.Checkbox({
      displayName: 'Include Deleted',
      description: 'Include soft-deleted customers in results.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default is 50).',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (default is 1).',
      required: false,
    }),
  },
  async run(context) {
    const {
      name,
      first_name,
      last_name,
      company,
      email,
      phone,
      currency,
      reference_id,
      category,
      include_deleted,
      limit,
      page,
    } = context.propsValue;

    const queryParams: Record<string, string> = {};

    if (name) queryParams['name'] = name;
    if (first_name) queryParams['first_name'] = first_name;
    if (last_name) queryParams['last_name'] = last_name;
    if (company) queryParams['company'] = company;
    if (email) queryParams['email'] = email;
    if (phone) queryParams['phone'] = phone;
    if (currency) queryParams['currency'] = currency;
    if (reference_id) queryParams['reference_id'] = reference_id;
    if (category) queryParams['category'] = category;
    if (include_deleted !== undefined) queryParams['include_deleted'] = include_deleted.toString();
    if (limit !== undefined) queryParams['limit'] = limit.toString();
    if (page !== undefined) queryParams['page'] = page.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${BASE_URL}/customers`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});

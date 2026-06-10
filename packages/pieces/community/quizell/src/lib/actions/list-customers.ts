import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quizellAuth } from '../../';
import { quizellApiCall } from '../common/client';

type CustomerRecord = Record<string, unknown>;

export const listCustomers = createAction({
  auth: quizellAuth,
  name: 'list_customers',
  displayName: 'List Customers',
  description: 'Retrieves a list of customers (quiz leads) from Quizell.',
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Filter customers by name or email. Leave empty to return all customers.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for results. Starts at 1.',
      required: false,
      defaultValue: 1,
    }),
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'How many customers to return per page. Maximum is 100.',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const { search, page, per_page } = context.propsValue;

    const queryParams: Record<string, string> = {
      page: String(page ?? 1),
      per_page: String(per_page ?? 25),
    };
    if (search) queryParams['search'] = search;

    const response = await quizellApiCall<{
      status: boolean;
      message: string;
      data: {
        data: CustomerRecord[];
        current_page: number;
        per_page: number;
        total: number;
      };
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/customers/list',
      queryParams,
    });

    const pagination = response.body.data;
    const customers = pagination.data ?? [];

    return {
      total: pagination.total ?? null,
      current_page: pagination.current_page ?? null,
      per_page: pagination.per_page ?? null,
      customers: customers.map((c) => ({
        id: c['id'] ?? null,
        quiz_id: c['quiz_id'] ?? null,
        email: c['email'] ?? null,
        first_name: c['first_name'] ?? null,
        last_name: c['last_name'] ?? null,
        phone: c['phone'] ?? null,
        country: c['country'] ?? null,
        city: c['city'] ?? null,
        address: c['address'] ?? null,
        note: c['note'] ?? null,
        created_at: c['created_at'] ?? null,
        updated_at: c['updated_at'] ?? null,
      })),
    };
  },
});

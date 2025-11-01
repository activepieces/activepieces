import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';

export const findCase = createAction({
  auth: myCaseAuth,
  name: 'findCase',
  displayName: 'Find Case',
  description: 'Searches for cases with filters',
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter by case status',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    updated_after: Property.ShortText({
      displayName: 'Updated After',
      description:
        'Filter cases updated after this date (ISO-8601: 2022-03-17T21:00:00Z)',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of results per page (1-1000)',
      required: false,
      defaultValue: 25,
    }),
    client_fields: Property.ShortText({
      displayName: 'Client Fields',
      description:
        'Comma-separated list of client fields to include (e.g., id,first_name,last_name)',
      required: false,
      defaultValue: 'id,first_name,last_name',
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};

    if (context.propsValue.status) {
      queryParams['filter[status]'] = context.propsValue.status;
    }

    if (context.propsValue.updated_after) {
      queryParams['filter[updated_after]'] = context.propsValue.updated_after;
    }

    if (context.propsValue.page_size) {
      queryParams['page_size'] = context.propsValue.page_size.toString();
    }

    if (context.propsValue.client_fields) {
      queryParams['field[client]'] = context.propsValue.client_fields;
    }

    try {
      const response = await myCaseApiService.fetchCases({ accessToken: context.auth.access_token, queryParams});

      return response
    } catch (error) {
      return {
        success: false,
        error: 'Failed to find cases',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

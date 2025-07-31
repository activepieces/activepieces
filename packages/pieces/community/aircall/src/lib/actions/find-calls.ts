import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aircallAuth } from '../common/auth';
import { makeClient } from '../common/client';

export const findCallsAction = createAction({
  auth: aircallAuth,
  name: 'find_calls',
  displayName: 'Find Calls',
  description: 'Search for calls matching criteria like phone number or date',
  props: {
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number to search for calls',
      required: false,
    }),
    userId: Property.Number({
      displayName: 'User ID',
      description: 'User ID to filter calls by',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'From Date',
      description: 'Start date for call search (YYYY-MM-DD)',
      required: false,
    }),
    to: Property.ShortText({
      displayName: 'To Date',
      description: 'End date for call search (YYYY-MM-DD)',
      required: false,
    }),
    perPage: Property.Number({
      displayName: 'Per Page',
      description: 'Number of results per page (default: 50)',
      required: false,
      defaultValue: 50,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (default: 1)',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    // Validate inputs
    if (context.propsValue.phoneNumber) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(context.propsValue.phoneNumber.replace(/\s/g, ''))) {
        throw new Error('Invalid phone number format');
      }
    }

    if (context.propsValue.userId && context.propsValue.userId <= 0) {
      throw new Error('User ID must be a positive number');
    }

    if (context.propsValue.from) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(context.propsValue.from)) {
        throw new Error('From date must be in YYYY-MM-DD format');
      }
    }

    if (context.propsValue.to) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(context.propsValue.to)) {
        throw new Error('To date must be in YYYY-MM-DD format');
      }
    }

    if (context.propsValue.perPage && (context.propsValue.perPage < 1 || context.propsValue.perPage > 100)) {
      throw new Error('Per page must be between 1 and 100');
    }

    if (context.propsValue.page && context.propsValue.page < 1) {
      throw new Error('Page must be a positive number');
    }

    // Validate date range if both dates are provided
    if (context.propsValue.from && context.propsValue.to) {
      const fromDate = new Date(context.propsValue.from);
      const toDate = new Date(context.propsValue.to);
      if (fromDate > toDate) {
        throw new Error('From date cannot be after to date');
      }
    }

    const client = makeClient({
      apiToken: context.auth.apiToken,
      baseUrl: context.auth.baseUrl || 'https://api.aircall.io/v1',
    });

    const queryParams: Record<string, string> = {};

    if (context.propsValue.phoneNumber) {
      queryParams['phone_number'] = context.propsValue.phoneNumber.trim();
    }

    if (context.propsValue.userId) {
      queryParams['user_id'] = context.propsValue.userId.toString();
    }

    if (context.propsValue.from) {
      queryParams['from'] = context.propsValue.from;
    }

    if (context.propsValue.to) {
      queryParams['to'] = context.propsValue.to;
    }

    if (context.propsValue.perPage) {
      queryParams['per_page'] = context.propsValue.perPage.toString();
    }

    if (context.propsValue.page) {
      queryParams['page'] = context.propsValue.page.toString();
    }

    try {
      const response = await client.makeRequest({
        method: HttpMethod.GET,
        url: '/calls/search',
        queryParams,
      });

      return response;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('Invalid search parameters. Please check your input.');
      }
      if (error.response?.status === 404) {
        throw new Error('No calls found matching the search criteria.');
      }
      throw new Error(`Failed to search calls: ${error.message}`);
    }
  },
}); 
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplybookAuth, getAccessToken, SimplybookAuth } from '../common';

export const createDetailedReport = createAction({
  auth: simplybookAuth,
  name: 'create_detailed_report',
  displayName: 'Create Detailed Report',
  description: 'Generate a detailed report (metrics, bookings, revenue)',
  props: {
    createdDateFrom: Property.ShortText({
      displayName: 'Created Date From',
      description: 'Filter by booking creation date from (format: YYYY-MM-DD)',
      required: false
    }),
    createdDateTo: Property.ShortText({
      displayName: 'Created Date To',
      description: 'Filter by booking creation date to (format: YYYY-MM-DD)',
      required: false
    }),
    dateFrom: Property.ShortText({
      displayName: 'Date From',
      description: 'Filter by booking date from (format: YYYY-MM-DD)',
      required: false
    }),
    dateTo: Property.ShortText({
      displayName: 'Date To',
      description: 'Filter by booking date to (format: YYYY-MM-DD)',
      required: false
    }),
    code: Property.ShortText({
      displayName: 'Booking Code',
      description: 'Filter by booking code',
      required: false
    }),
    eventId: Property.Number({
      displayName: 'Service ID',
      description: 'Filter by service ID',
      required: false
    }),
    unitGroupId: Property.Number({
      displayName: 'Service Provider ID',
      description: 'Filter by service provider ID',
      required: false
    }),
    clientId: Property.Number({
      displayName: 'Client ID',
      description: 'Filter by client ID',
      required: false
    }),
    bookingType: Property.StaticDropdown({
      displayName: 'Booking Type',
      description: 'Filter by booking type',
      required: false,
      options: {
        options: [
          { label: 'Non-Cancelled', value: 'non_cancelled' },
          { label: 'Cancelled', value: 'cancelled' }
        ]
      }
    }),
    orderField: Property.ShortText({
      displayName: 'Order Field',
      description: 'Field to order results by (e.g., record_date)',
      required: false,
      defaultValue: 'record_date'
    }),
    orderDirection: Property.StaticDropdown({
      displayName: 'Order Direction',
      description: 'Sort order direction',
      required: false,
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' }
        ]
      },
      defaultValue: 'asc'
    }),
    exportColumns: Property.Json({
      displayName: 'Export Columns',
      description: 'Array of columns to export (leave empty for all columns)',
      required: false
    })
  },
  async run(context) {
    const auth = context.auth.props;
    const accessToken = await getAccessToken(auth);

    const filter: any = {};

    // Build filter object
    if (context.propsValue.createdDateFrom) {
      filter.created_date_from = context.propsValue.createdDateFrom;
    }
    if (context.propsValue.createdDateTo) {
      filter.created_date_to = context.propsValue.createdDateTo;
    }
    if (context.propsValue.dateFrom) {
      filter.date_from = context.propsValue.dateFrom;
    }
    if (context.propsValue.dateTo) {
      filter.date_to = context.propsValue.dateTo;
    }
    if (context.propsValue.code) {
      filter.code = context.propsValue.code;
    }
    if (context.propsValue.eventId) {
      filter.event_id = context.propsValue.eventId.toString();
    }
    if (context.propsValue.unitGroupId) {
      filter.unit_group_id = context.propsValue.unitGroupId.toString();
    }
    if (context.propsValue.clientId) {
      filter.client_id = context.propsValue.clientId.toString();
    }
    if (context.propsValue.bookingType) {
      filter.booking_type = context.propsValue.bookingType;
    }

    const requestBody: any = {
      filter,
      export_columns: context.propsValue.exportColumns || [],
      order_direction: context.propsValue.orderDirection || 'asc',
      order_field: context.propsValue.orderField || 'record_date'
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://user-api-v2.simplybook.me/admin/detailed-report',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': auth.companyLogin,
          'X-Token': accessToken
        },
        body: requestBody
      });

      return response.body;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to generate detailed report: ${error.response.status} - ${JSON.stringify(error.response.body)}`
        );
      }
      throw new Error(`Failed to generate detailed report: ${error.message}`);
    }
  }
});

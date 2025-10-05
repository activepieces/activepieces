import { Property, createAction } from '@activepieces/pieces-framework';
import { simplyBookAuth, makeApiRequest } from '../common';

export const createDetailedReportAction = createAction({
  auth: simplyBookAuth,
  name: 'create_detailed_report',
  displayName: 'Create Detailed Report',
  description: 'Generate a detailed report with metrics, bookings, and revenue',
  props: {
    reportType: Property.StaticDropdown({
      displayName: 'Report Type',
      description: 'Type of report to generate',
      required: true,
      options: {
        options: [
          { label: 'Bookings Report', value: 'bookings' },
          { label: 'Revenue Report', value: 'revenue' },
          { label: 'Client Report', value: 'clients' },
          { label: 'Provider Report', value: 'providers' },
          { label: 'Service Report', value: 'services' },
        ],
      },
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Start date for the report',
      required: true,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'End date for the report',
      required: true,
    }),
    providerId: Property.Number({
      displayName: 'Provider ID',
      description: 'Filter by specific provider (optional)',
      required: false,
    }),
    serviceId: Property.Number({
      displayName: 'Service ID',
      description: 'Filter by specific service (optional)',
      required: false,
    }),
    format: Property.StaticDropdown({
      displayName: 'Report Format',
      description: 'Format of the generated report',
      required: false,
      options: {
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'CSV', value: 'csv' },
          { label: 'PDF', value: 'pdf' },
        ],
      },
      defaultValue: 'json',
    }),
  },
  async run(context) {
    const { reportType, startDate, endDate, providerId, serviceId, format } = context.propsValue;
    
    const params = {
      report_type: reportType,
      start_date: startDate,
      end_date: endDate,
      ...(providerId && { provider_id: providerId }),
      ...(serviceId && { service_id: serviceId }),
      format: format || 'json',
    };

    return await makeApiRequest(context.auth, 'generateReport', params);
  },
});

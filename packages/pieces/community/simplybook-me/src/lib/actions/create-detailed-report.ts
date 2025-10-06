import { createAction, Property } from '@activepieces/pieces-framework';
import { simplybookAuth } from '../../index';
import { SimplyBookClient, ReportParams, ReportParamsSchema } from '../common';

export const createDetailedReport = createAction({
  auth: simplybookAuth,
  name: 'create_detailed_report',
  displayName: 'Create Detailed Report',
  description: 'Generate a detailed report from SimplyBook.me',
  props: {
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Report start date',
      required: true,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'Report end date',
      required: true,
    }),
    reportType: Property.StaticDropdown({
      displayName: 'Report Type',
      description: 'Type of report to generate',
      required: true,
      options: {
        options: [
          { label: 'Bookings Report', value: 'bookings' },
          { label: 'Revenue Report', value: 'revenue' },
          { label: 'Client Report', value: 'clients' },
          { label: 'Service Report', value: 'services' },
        ],
      },
    }),
  },
  async run(context) {
    const { startDate, endDate, reportType } = context.propsValue;
    const { companyLogin, apiKey, baseUrl } = context.auth;

    const params: ReportParams = {
      start_date: startDate,
      end_date: endDate,
      type: reportType,
    };

    const validatedParams = ReportParamsSchema.parse(params);

    const client = new SimplyBookClient({
      companyLogin,
      apiKey,
      baseUrl,
    });

    try {
      const report = await client.createReport(validatedParams);
      return {
        success: true,
        report,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});

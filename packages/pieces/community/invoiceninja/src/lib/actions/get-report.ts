import { createAction, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from '../common/auth';
import { invoiceNinjaClient } from '../common/client';
import { invoiceNinjaOutputSchemas } from '../common/output-schemas';
import { invoiceNinjaProps } from '../common/props';
import { invoiceNinjaReports } from '../common/report';

export const getReport = createAction({
  auth: invoiceninjaAuth,
  name: 'getreport_task',
  classification: 'SEARCH',
  displayName: 'Get Report',
  description: 'Runs an Invoice Ninja report and returns its columns and rows.',
  audience: 'human',
  outputSchema: invoiceNinjaOutputSchemas.report,
  props: {
    reportType: invoiceNinjaReports.reportProps().report_type,
    dateRange: invoiceNinjaReports.reportProps().date_range,
    startDate: invoiceNinjaReports.reportProps().start_date,
    endDate: invoiceNinjaReports.reportProps().end_date,
    clientID: invoiceNinjaProps.clientDropdown({ required: false, displayName: 'Client' }),
    numberOfResults: Property.Number({
      displayName: 'Max Rows',
      description: 'Return at most this many rows. Empty = all.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = invoiceNinjaClient.optionalInt({ value: propsValue.numberOfResults, label: 'Max Rows', min: 1, max: 100000 });
    const report = await invoiceNinjaReports.runReport({
      auth: auth.props,
      reportType: propsValue.reportType ?? '',
      dateRange: propsValue.dateRange ?? 'all',
      startDate: propsValue.startDate,
      endDate: propsValue.endDate,
      clientId: propsValue.clientID,
    });
    if (limit === undefined || report.rows.length <= limit) return report;
    const rows = report.rows.slice(0, limit);
    return { ...report, rows, rowCount: rows.length };
  },
});

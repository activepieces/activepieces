import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { InvoiceNinjaApiError, InvoiceNinjaAuthValue, invoiceNinjaClient } from './client';

const POLL_INTERVAL_MS = 2_000;
const POLL_DEADLINE_MS = 60_000;

async function runReport({ auth, reportType, dateRange, startDate, endDate, clientId }: RunReportInput): Promise<ReportResult> {
  if (!REPORT_TYPES.some((type) => type.value === reportType)) {
    throw new Error(`Unknown report type ${reportType}.`);
  }
  if (!DATE_RANGES.some((range) => range.value === dateRange)) {
    throw new Error(`Unknown date range ${dateRange}.`);
  }
  const start = invoiceNinjaClient.toDateOnly({ value: startDate, label: 'Start Date' });
  const end = invoiceNinjaClient.toDateOnly({ value: endDate, label: 'End Date' });
  if (dateRange === 'custom' && (start === undefined || end === undefined)) {
    throw new Error('A custom date range needs both Start Date and End Date.');
  }
  const started = await invoiceNinjaClient.request({
    auth,
    method: HttpMethod.POST,
    path: `/reports/${reportType}`,
    query: { output: 'json' },
    body: invoiceNinjaClient.compact({
      date_range: dateRange,
      start_date: dateRange === 'custom' ? start : undefined,
      end_date: dateRange === 'custom' ? end : undefined,
      client_id: invoiceNinjaClient.optionalId({ value: clientId, label: 'Client ID' }),
      report_keys: [],
      send_email: false,
      include_deleted: false,
    }),
  });
  const reportId = invoiceNinjaClient.isRecord(started) && typeof started['message'] === 'string' ? started['message'] : '';
  if (!/^[A-Za-z0-9-]{8,64}$/.test(reportId)) {
    throw new Error('Invoice Ninja did not return a report job ID.');
  }
  const deadline = Date.now() + POLL_DEADLINE_MS;
  while (deadline - Date.now() > POLL_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) break;
    try {
      const preview = await invoiceNinjaClient.request({
        auth,
        method: HttpMethod.POST,
        path: `/reports/preview/${reportId}`,
        timeoutMs: remainingMs,
      });
      return shape({ reportType, preview });
    } catch (error) {
      if (!(error instanceof InvoiceNinjaApiError) || error.status !== 409) throw error;
    }
  }
  throw new Error(`The Invoice Ninja report ${reportType} was not ready after ${POLL_DEADLINE_MS / 1000} seconds; try a smaller date range.`);
}

function shape({ reportType, preview }: { reportType: string; preview: unknown }): ReportResult {
  if (!invoiceNinjaClient.isRecord(preview)) {
    throw new Error('Invoice Ninja returned the report in an unexpected format.');
  }
  const columns = invoiceNinjaClient
    .arrayOf(preview['columns'])
    .filter(invoiceNinjaClient.isRecord)
    .map((column) => ({ identifier: String(column['identifier'] ?? ''), display_value: String(column['display_value'] ?? '') }));
  const rows = Object.entries(preview)
    .filter(([key]) => /^\d+$/.test(key))
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, cells]) =>
      Object.fromEntries(
        invoiceNinjaClient
          .arrayOf(cells)
          .filter(invoiceNinjaClient.isRecord)
          .map((cell) => [String(cell['identifier'] ?? ''), cell['display_value'] ?? cell['value'] ?? null]),
      ),
    );
  return { reportType, columns, rows, rowCount: rows.length };
}

function reportProps() {
  return {
    report_type: Property.StaticDropdown<string>({
      displayName: 'Report Type',
      required: true,
      options: { options: REPORT_TYPES },
    }),
    date_range: Property.StaticDropdown<string>({
      displayName: 'Date Range',
      description: 'Default: all time.',
      required: false,
      options: { options: DATE_RANGES },
    }),
    start_date: Property.ShortText({ displayName: 'Start Date', description: 'YYYY-MM-DD, for a custom range.', required: false }),
    end_date: Property.ShortText({ displayName: 'End Date', description: 'YYYY-MM-DD, for a custom range.', required: false }),
    client_id: Property.ShortText({ displayName: 'Client ID', description: 'Only this client (optional).', required: false }),
  };
}

const REPORT_TYPES = [
  { label: 'Clients', value: 'clients' },
  { label: 'Contacts', value: 'contacts' },
  { label: 'Invoices', value: 'invoices' },
  { label: 'Invoice Items', value: 'invoice_items' },
  { label: 'Quotes', value: 'quotes' },
  { label: 'Quote Items', value: 'quote_items' },
  { label: 'Credits', value: 'credits' },
  { label: 'Payments', value: 'payments' },
  { label: 'Recurring Invoices', value: 'recurring_invoices' },
  { label: 'Expenses', value: 'expenses' },
  { label: 'Tasks', value: 'tasks' },
  { label: 'Products', value: 'products' },
  { label: 'Vendors', value: 'vendors' },
];

const DATE_RANGES = [
  { label: 'All time', value: 'all' },
  { label: 'Last 7 days', value: 'last7' },
  { label: 'Last 30 days', value: 'last30' },
  { label: 'This month', value: 'this_month' },
  { label: 'Last month', value: 'last_month' },
  { label: 'This quarter', value: 'this_quarter' },
  { label: 'Last quarter', value: 'last_quarter' },
  { label: 'This year', value: 'this_year' },
  { label: 'Last year', value: 'last_year' },
  { label: 'Custom (start and end date)', value: 'custom' },
];

export const invoiceNinjaReports = { runReport, reportProps };

type RunReportInput = {
  auth: InvoiceNinjaAuthValue;
  reportType: string;
  dateRange: string;
  startDate?: unknown;
  endDate?: unknown;
  clientId?: unknown;
};

export type ReportResult = {
  reportType: string;
  columns: { identifier: string; display_value: string }[];
  rows: Record<string, unknown>[];
  rowCount: number;
};

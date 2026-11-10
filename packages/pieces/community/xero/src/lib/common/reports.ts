import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { XERO_URLS, xeroApi, xeroValue } from './client';

function cellValue({ cell }: { cell: Record<string, unknown> }): string {
  const value = cell['Value'];
  return typeof value === 'string' ? value : value === undefined || value === null ? '' : String(value);
}

function attributeOf({ cells, id }: { cells: Record<string, unknown>[]; id: string }): string | null {
  for (const cell of cells) {
    const attribute = xeroValue.readRecords(cell['Attributes']).find((entry) => typeof entry['Id'] === 'string' && entry['Id'].toLowerCase() === id);
    const value = attribute ? xeroValue.readString(attribute['Value']) : undefined;
    if (value) return value;
  }
  return null;
}

function flattenRows({ rows, section }: { rows: Record<string, unknown>[]; section: string }): FlatReportRow[] {
  return rows.flatMap((row) => {
    const rowType = xeroValue.readString(row['RowType']) ?? 'Row';
    if (rowType === 'Header') return [];
    if (rowType === 'Section') {
      const title = typeof row['Title'] === 'string' ? row['Title'] : '';
      return flattenRows({ rows: xeroValue.readRecords(row['Rows']), section: title });
    }
    const cells = xeroValue.readRecords(row['Cells']);
    const [first, ...rest] = cells;
    return [
      {
        section,
        rowType,
        label: first ? cellValue({ cell: first }) : '',
        values: rest.map((cell) => cellValue({ cell })),
        accountId: attributeOf({ cells: first ? [first] : [], id: 'account' }),
        invoiceId: attributeOf({ cells, id: 'invoiceid' }),
      },
    ];
  });
}

function flattenReport({ body }: { body: unknown }): FlatReport {
  const report = xeroApi.firstRecord({ body, key: 'Reports', operation: 'report' });
  const rows = xeroValue.readRecords(report['Rows']);
  const header = rows.find((row) => row['RowType'] === 'Header');
  const titles = Array.isArray(report['ReportTitles']) ? report['ReportTitles'].filter((title): title is string => typeof title === 'string') : [];
  return {
    reportId: xeroValue.readString(report['ReportID']) ?? null,
    reportName: xeroValue.readString(report['ReportName']) ?? null,
    reportType: xeroValue.readString(report['ReportType']) ?? null,
    reportDate: xeroValue.readString(report['ReportDate']) ?? null,
    reportTitles: titles,
    columns: header ? xeroValue.readRecords(header['Cells']).map((cell) => cellValue({ cell })) : [],
    rows: flattenRows({ rows, section: '' }),
  };
}

async function fetchReport({
  accessToken,
  tenantId,
  report,
  queryParams,
}: {
  accessToken: string;
  tenantId: string;
  report: string;
  queryParams: QueryParams;
}): Promise<FlatReport> {
  const body = await xeroApi.request<unknown>({
    accessToken,
    tenantId,
    method: HttpMethod.GET,
    url: `${XERO_URLS.api}/Reports/${report}`,
    queryParams,
    operation: `${report} report`,
  });
  return flattenReport({ body });
}

function definedParams({ params }: { params: Record<string, string | number | boolean | undefined | null> }): QueryParams {
  return Object.fromEntries(
    Object.entries(params).flatMap(([key, value]) => (value === undefined || value === null || value === '' ? [] : [[key, String(value)]])),
  );
}

function periodsParam({ value }: { value: unknown }): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const periods = Number(value);
  if (!Number.isInteger(periods) || periods < 1 || periods > 11) throw new Error('Comparison Periods must be a whole number from 1 to 11.');
  return periods;
}

export const xeroReports = {
  periodsParam,
  fetchReport,
  flattenReport,
  definedParams,
};

export type FlatReportRow = {
  section: string;
  rowType: string;
  label: string;
  values: string[];
  accountId: string | null;
  invoiceId: string | null;
};

export type FlatReport = {
  reportId: string | null;
  reportName: string | null;
  reportType: string | null;
  reportDate: string | null;
  reportTitles: string[];
  columns: string[];
  rows: FlatReportRow[];
};

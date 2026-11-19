import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import ExcelJS from 'exceljs';

// ---------------------------------------------------------------------------
// API settings: the only place to change when the no-pagination API is ready.
// Today (testing): the paginated API. perPage is taken from the count API so
// every device comes in one call (fallback: FALLBACK_PER_PAGE).
// Later: set REPORT_ENDPOINT to the new path, PAGING = {} and USE_COUNT_API = false.
// ---------------------------------------------------------------------------
const REPORT_ENDPOINT = '/asset/getComplainceApplicationTableByLimit';
const COUNT_ENDPOINT = '/asset/getComplainceApplicationTableCount';
const USE_COUNT_API = true;
const FALLBACK_PER_PAGE = 10000;
const PAGING: Record<string, string> = { pageNo: '1' }; // perPage is added automatically

const esc = (s: any) =>
    String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const textToHtml = (s: string) => esc(s).replace(/\r?\n/g, '<br>');
const num = (n: any) => Number(n ?? 0).toLocaleString('en-IN');
const dash = (s: any) => (String(s ?? '').trim() === '' ? '-' : String(s).trim());
const txt = (v: any) => (v === null || v === undefined ? '' : String(v).trim());

const reportDate = () =>
    new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }).replace(/\//g, '-');

function extractList(body: any): any[] | null {
    let b = body;
    if (typeof b === 'string') {
        if (b.trim() === '') return [];
        try {
            b = JSON.parse(b);
        } catch {
            return null;
        }
    }
    if (Array.isArray(b)) return b;
    if (b && typeof b === 'object') {
        for (const k of ['data', 'content', 'result', 'results', 'list', 'records', 'items']) {
            if (Array.isArray(b[k])) return b[k];
        }
        const firstArray = Object.values(b).find(v => Array.isArray(v));
        if (firstArray) return firstArray as any[];
    }
    return null;
}

const preview = (body: any) => {
    const text = typeof body === 'string' ? body : JSON.stringify(body);
    return String(text ?? '').slice(0, 300);
};

// Status text from the API ("NA", "Compliant", "Non Compliant", ...) -> one of 3 groups
type Status = 'Compliant' | 'Non Compliant' | 'NA';
const normStatus = (v: any): Status => {
    const s = txt(v).toLowerCase();
    if (!s || s === 'na' || s === 'n/a' || s === 'not applicable') return 'NA';
    if (s.startsWith('non') || s.startsWith('not') || s === 'no' || s === 'false') return 'Non Compliant';
    if (s.includes('complian') || s === 'yes' || s === 'true') return 'Compliant';
    return 'NA';
};
const statusClass = (s: Status) => (s === 'Compliant' ? 'st-green' : s === 'Non Compliant' ? 'st-red' : 'st-other');
const STATUS_RANK: Record<Status, number> = { 'Non Compliant': 3, Compliant: 2, NA: 1 };

const cmpText = (x: string, y: string) => {
    if (!x && !y) return 0;
    if (!x) return 1; // empty values always at the end
    if (!y) return -1;
    return x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
};

// Old flat fields of the API (usually null); shown in Excel only if any row has a value
const LEGACY_FIELDS: { key: string; header: string }[] = [
    { key: 'trellixAgentComplience', header: 'Trellix Agent Compliance (Old Field)' },
    { key: 'trellixAgentVersion', header: 'Trellix Agent Version (Old Field)' },
    { key: 'trellixDLPComplience', header: 'Trellix DLP Compliance (Old Field)' },
    { key: 'trellixDLPVersion', header: 'Trellix DLP Version (Old Field)' },
    { key: 'crowdStickComplience', header: 'CrowdStrike Compliance (Old Field)' },
    { key: 'crowdStickVersion', header: 'CrowdStrike Version (Old Field)' },
    { key: 'forcePointComplience', header: 'ForcePoint Compliance (Old Field)' },
    { key: 'forcePointVersion', header: 'ForcePoint Version (Old Field)' },
    { key: 'sscmComplience', header: 'SSCM Compliance (Old Field)' },
    { key: 'sscmVersion', header: 'SSCM Version (Old Field)' },
];

type SortKey = 'computeName' | 'employeeName' | 'assetId' | 'status';
type StatusFilter = 'all' | 'nonCompliant' | 'compliant' | 'na';

type AppInfo = { applicationName: string; status: string; version: string; complianceCount: number; nonComplianceCount: number; totalCount: number };

type Row = {
    srNo: number;
    computeName: string;
    assetId: string;
    serialNo: string;
    make: string;
    model: string;
    employeeName: string;
    employeeNo: string;
    compliantApps: number;
    nonCompliantApps: number;
    naApps: number;
    overallStatus: Status;
    applications: AppInfo[];
    legacy: Record<string, string>;
};

function buildHtml(opts: {
    title: string;
    dateStr: string;
    topText: string;
    hasExcel: boolean;
    filterLabel: string;
    totalDevices: number;
    compliantDevices: number;
    nonCompliantDevices: number;
    naDevices: number;
    shownRows: Row[];
}): string {
    const { title, dateStr, topText, hasExcel, filterLabel, totalDevices, compliantDevices, nonCompliantDevices, naDevices, shownRows } = opts;

    const tableRows = shownRows
        .map((r, i) => `
<tr class="${i % 2 ? 'alt' : ''}">
  <td data-label="Sr No" class="num">${r.srNo}</td>
  <td data-label="Compute Name" class="name">${esc(dash(r.computeName))}</td>
  <td data-label="Asset ID">${esc(dash(r.assetId))}</td>
  <td data-label="Employee">${esc(dash(r.employeeName))}</td>
  <td data-label="Model">${esc(dash(r.model))}</td>
  <td data-label="Compliant Apps" class="num">${num(r.compliantApps)}</td>
  <td data-label="Non Compliant Apps" class="num">${num(r.nonCompliantApps)}</td>
  <td data-label="Status"><span class="badge ${statusClass(r.overallStatus)}">${esc(r.overallStatus)}</span></td>
</tr>`)
        .join('');

    const emptyRow = shownRows.length === 0
        ? `<tr><td colspan="8" style="padding:18px;text-align:center;color:#64748b;">No devices found.</td></tr>`
        : '';

    const truncated = totalDevices > shownRows.length;
    const note = truncated
        ? `Showing the first ${num(shownRows.length)} of ${num(totalDevices)} devices.${
              hasExcel ? ' The complete list with application wise status and version is attached as an Excel file with this email.' : ''
          }`
        : hasExcel && shownRows.length > 0
        ? 'The application wise status and version for each device is attached as an Excel file with this email.'
        : '';

    const intro = topText.trim() !== '' ? `<div class="intro">${textToHtml(topText.trim())}</div>` : '';
    const tags = filterLabel ? `<div class="tags"><span class="tag">${esc(filterLabel)}</span></div>` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<style>
  body{margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;}
  .wrap{width:100%;padding:24px 12px;box-sizing:border-box;}
  .intro{max-width:1000px;margin:0 auto 18px;padding:0 4px;font-size:15px;line-height:1.7;color:#1e293b;word-break:break-word;}
  .card{max-width:1000px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,.10);}
  .header{background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#fff;padding:28px 24px;}
  .header h1{margin:0;font-size:22px;font-weight:700;}
  .header p{margin:6px 0 0;font-size:13px;opacity:.9;}
  .content{padding:22px 24px;}
  .tags{margin:0 0 16px;}
  .tag{display:inline-block;padding:4px 12px;margin:0 8px 6px 0;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:700;}
  .kpis{width:100%;border-collapse:separate;border-spacing:10px 0;margin:0 -10px 20px;}
  .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 10px;text-align:center;}
  .kpi .v{font-size:24px;font-weight:700;display:block;}
  .kpi .l{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;}
  .k-dev .v{color:#1d4ed8;} .k-ok .v{color:#16a34a;} .k-bad .v{color:#dc2626;} .k-na .v{color:#64748b;}
  table.data{width:100%;border-collapse:collapse;font-size:13px;}
  table.data th{background:#eef2ff;color:#3730a3;text-align:left;padding:10px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.4px;}
  table.data td{padding:9px 8px;border-bottom:1px solid #e2e8f0;vertical-align:middle;word-break:break-word;}
  table.data tr.alt td{background:#fafbff;}
  td.num,th.num{text-align:right;}
  td.name{font-weight:600;}
  .badge{display:inline-block;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;}
  .st-red{background:#fee2e2;color:#b91c1c;} .st-green{background:#dcfce7;color:#15803d;} .st-other{background:#e2e8f0;color:#475569;}
  .note{margin-top:18px;font-size:13px;color:#475569;line-height:1.5;}
  .footer{background:#f1f5f9;text-align:center;padding:16px;font-size:12px;color:#94a3b8;}

  @media only screen and (max-width:600px){
    .intro{font-size:14px;}
    .header{padding:22px 16px;} .content{padding:16px;}
    .kpis,.kpis tbody,.kpis tr,.kpis td{display:block;width:100%;}
    .kpis{border-spacing:0;margin:0 0 12px;}
    .kpis td{margin-bottom:10px;}
    table.data thead{display:none;}
    table.data,table.data tbody,table.data tr,table.data td{display:block;width:100%;box-sizing:border-box;}
    table.data tr{display:flex;flex-direction:column;margin-bottom:12px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;background:#fff;}
    table.data tr.alt td{background:#fff;}
    table.data td{display:flex;justify-content:space-between;align-items:center;text-align:right;border-bottom:1px solid #f1f5f9;padding:9px 12px;}
    table.data td:last-child{border-bottom:none;}
    table.data td:before{content:attr(data-label);font-weight:600;color:#64748b;text-align:left;font-size:12px;text-transform:uppercase;margin-right:12px;}
    td.name{order:-1;background:#eef2ff;color:#3730a3;font-size:15px;justify-content:flex-start;}
    td.name:before{content:'';margin:0;}
  }
</style>
</head>
<body>
<div class="wrap">
  ${intro}
  <div class="card">
    <div class="header">
      <h1>${esc(title)}</h1>
      <p>As on ${esc(dateStr)}</p>
    </div>
    <div class="content">
      ${tags}
      <table class="kpis" role="presentation"><tr>
        <td class="kpi k-dev"><span class="v">${num(totalDevices)}</span><span class="l">Devices</span></td>
        <td class="kpi k-ok"><span class="v">${num(compliantDevices)}</span><span class="l">Compliant</span></td>
        <td class="kpi k-bad"><span class="v">${num(nonCompliantDevices)}</span><span class="l">Non Compliant</span></td>
        <td class="kpi k-na"><span class="v">${num(naDevices)}</span><span class="l">NA</span></td>
      </tr></table>

      <table class="data">
        <thead><tr>
          <th class="num">Sr No</th><th>Compute Name</th><th>Asset ID</th><th>Employee</th><th>Model</th>
          <th class="num">Compliant Apps</th><th class="num">Non Compliant Apps</th><th>Status</th>
        </tr></thead>
        <tbody>${tableRows}${emptyRow}</tbody>
      </table>

      ${note ? `<p class="note">${esc(note)}</p>` : ''}
    </div>
    <div class="footer">This is an automated report. Please do not reply to this email.</div>
  </div>
</div>
</body>
</html>`;
}

export const complianceApplicationReport = createAction({
    auth: zioSetAuth,
    name: 'compliance_application_report',
    displayName: 'Compliance Application Report',
    description: 'Gets the device wise application compliance report (asset, employee, application status and version). Optionally builds an Excel file and a responsive email body',
    aiMetadata: {
        description:
            'Reads the application compliance table from ZioSet and returns one row for each device with Compute Name, Asset ID, Serial No, Make, Model, Employee Name, Employee No ' +
            'and, for each application (for example Configuration Manager Client, CrowdStrike Windows Sensor, Trellix Agent, Microsoft Intune), its compliance Status and Version. ' +
            'Each device also gets the number of compliant, non compliant and NA applications and an overall status (Non Compliant if any application is non compliant, else Compliant if any is compliant, else NA). ' +
            'Totals: number of devices and how many are Compliant, Non Compliant and NA. If there is no data, the report is empty and hasData is false. ' +
            'The action uses all data returned by the API (the device count is read from the count API) and applies no record limit. ' +
            'Options: status filter (all, non compliant, compliant, NA), sort column, rows in email (empty or 0 means all rows, default 50 because the list can have thousands of devices), ' +
            'email top text (optional message shown at the very top of the email, above the report), Excel on/off, email template on/off. ' +
            'The optional Excel file always has all rows and all fields, with one Status and one Version column for each application. The optional HTML email body has KPI cards (always based on all filtered rows) and a table, ' +
            'limited to the first N rows of the chosen sort order when Rows In Email is set. ' +
            'It only reads data and builds report files, so repeating the call with the same input is safe. ' +
            'Use the OsWiseComplianceReport action for operating system wise compliance counts.',
        idempotent: true,
    },
    props: {
        title: Property.ShortText({
            displayName: 'Report Title',
            required: false,
            defaultValue: 'Compliance Table Report',
        }),
        emailTopText: Property.LongText({
            displayName: 'Email Top Text',
            description: 'Optional message shown at the very top of the email, above the report. Example: Dear Sir, please find the application compliance report below. Leave empty to show nothing.',
            required: false,
        }),
        statusFilter: Property.StaticDropdown({
            displayName: 'Show Devices',
            description: 'Filter the report by overall device status',
            required: false,
            defaultValue: 'all',
            options: {
                options: [
                    { label: 'All devices', value: 'all' },
                    { label: 'Non Compliant only', value: 'nonCompliant' },
                    { label: 'Compliant only', value: 'compliant' },
                    { label: 'NA only', value: 'na' },
                ],
            },
        }),
        sortBy: Property.StaticDropdown({
            displayName: 'Sort By',
            required: false,
            defaultValue: 'status',
            options: {
                options: [
                    { label: 'Status (Non Compliant first)', value: 'status' },
                    { label: 'Compute Name', value: 'computeName' },
                    { label: 'Employee Name', value: 'employeeName' },
                    { label: 'Asset ID', value: 'assetId' },
                ],
            },
        }),
        emailRowLimit: Property.Number({
            displayName: 'Rows In Email',
            description: 'How many rows to show in the email body. Leave empty or 0 to show all rows (default). The Excel file always has all rows.',
            required: false,
        }),
        generateExcel: Property.Checkbox({
            displayName: 'Generate Excel',
            description: 'Turn ON to create the Excel file with all the data',
            required: false,
            defaultValue: true,
        }),
        generateEmailTemplate: Property.Checkbox({
            displayName: 'Generate Email Template',
            description: 'Turn ON to create the responsive HTML email body',
            required: false,
            defaultValue: true,
        }),
    },

    async run(context) {
        const baseUrl = String(context.auth.props.baseUrl ?? '').replace(/\/+$/, '');
        const title = context.propsValue.title || 'Compliance Table Report';
        const topText = String(context.propsValue.emailTopText ?? '');
        const statusFilter = ((context.propsValue.statusFilter as string) || 'all') as StatusFilter;
        const sortBy = ((context.propsValue.sortBy as string) || 'status') as SortKey;
        const emailRowLimit = Number(context.propsValue.emailRowLimit) > 0 ? Math.floor(Number(context.propsValue.emailRowLimit)) : 0; // 0 = all rows
        const generateExcel = context.propsValue.generateExcel ?? true;
        const generateEmailTemplate = context.propsValue.generateEmailTemplate ?? true;

        const headers = { authorization: `Bearer ${context.auth.access_token}` };

        // Step 1: how many devices are there (the count API returns a plain number, e.g. 8000)
        let apiCount = 0;
        const query: Record<string, string> = { ...PAGING };
        if (USE_COUNT_API) {
            try {
                const c = await httpClient.sendRequest<any>({
                    method: HttpMethod.GET,
                    url: `${baseUrl}${COUNT_ENDPOINT}`,
                    headers,
                    timeout: 60000,
                });
                const body: any = c.body;
                const n = Number(typeof body === 'string' ? body.trim() : typeof body === 'object' && body ? (body.count ?? body.data ?? body.total) : body);
                if (Number.isFinite(n) && n > 0) apiCount = Math.floor(n);
            } catch {
                // fall back to FALLBACK_PER_PAGE below
            }
            query['perPage'] = String(apiCount > 0 ? apiCount : FALLBACK_PER_PAGE);
        }

        // Step 2: the report
        const url = `${baseUrl}${REPORT_ENDPOINT}`;
        const res = await httpClient.sendRequest<any>({
            method: HttpMethod.GET,
            url,
            headers,
            queryParams: query,
            timeout: 300000,
        });

        const raw = extractList(res.body);
        if (raw === null) {
            // Do not return an empty report silently: show what the server really sent
            throw new Error(
                `Unexpected response from ${url} (status ${res.status}). Expected a list of devices. Response starts with: ${preview(res.body)}`
            );
        }

        const valid = raw.filter(r => r && typeof r === 'object');
        const skippedRows = raw.length - valid.length;

        // Application names in the order they first appear in the response
        const appNames: string[] = [];
        for (const r of valid) {
            for (const a of Array.isArray(r.complienceDataItemDTOs) ? r.complienceDataItemDTOs : []) {
                const n = txt(a?.applicationName);
                if (n && !appNames.includes(n)) appNames.push(n);
            }
        }

        const mapped = valid.map(r => {
            const applications: AppInfo[] = (Array.isArray(r.complienceDataItemDTOs) ? r.complienceDataItemDTOs : [])
                .filter((a: any) => a && txt(a.applicationName) !== '')
                .map((a: any) => ({
                    applicationName: txt(a.applicationName),
                    status: txt(a.complience) || 'NA', // the API spells it "complience"
                    version: txt(a.version),
                    complianceCount: Number(a.complienceCount ?? 0),
                    nonComplianceCount: Number(a.nonComplience ?? 0),
                    totalCount: Number(a.totalCount ?? 0),
                }));

            const groups = applications.map(a => normStatus(a.status));
            const compliantApps = groups.filter(g => g === 'Compliant').length;
            const nonCompliantApps = groups.filter(g => g === 'Non Compliant').length;
            const naApps = groups.length - compliantApps - nonCompliantApps;
            const overallStatus: Status = nonCompliantApps > 0 ? 'Non Compliant' : compliantApps > 0 ? 'Compliant' : 'NA';

            const legacy: Record<string, string> = {};
            for (const f of LEGACY_FIELDS) legacy[f.key] = txt(r[f.key]);

            return {
                computeName: txt(r.computeName), // the API spells it "computeName"
                assetId: txt(r.assetId),
                serialNo: txt(r.serialNo),
                make: txt(r.make),
                model: txt(r.model),
                employeeName: txt(r.employeeName),
                employeeNo: txt(r.employeeNo),
                compliantApps,
                nonCompliantApps,
                naApps,
                overallStatus,
                applications,
                legacy,
            };
        });

        const filtered = mapped.filter(r =>
            statusFilter === 'nonCompliant' ? r.overallStatus === 'Non Compliant'
            : statusFilter === 'compliant' ? r.overallStatus === 'Compliant'
            : statusFilter === 'na' ? r.overallStatus === 'NA'
            : true
        );

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'computeName':
                    return cmpText(a.computeName, b.computeName);
                case 'employeeName':
                    return cmpText(a.employeeName, b.employeeName);
                case 'assetId':
                    return cmpText(a.assetId, b.assetId);
                default:
                    return STATUS_RANK[b.overallStatus] - STATUS_RANK[a.overallStatus] || cmpText(a.computeName, b.computeName);
            }
        });

        // Sr. No. is assigned after sorting so it always runs 1..N in the shown order
        const finalRows: Row[] = filtered.map((r, i) => ({ srNo: i + 1, ...r }));

        // KPI cards always use all filtered rows
        const totalDevices = finalRows.length;
        const compliantDevices = finalRows.filter(r => r.overallStatus === 'Compliant').length;
        const nonCompliantDevices = finalRows.filter(r => r.overallStatus === 'Non Compliant').length;
        const naDevices = totalDevices - compliantDevices - nonCompliantDevices;

        const shownRows = emailRowLimit > 0 ? finalRows.slice(0, emailRowLimit) : finalRows;
        const dateStr = reportDate();
        const filterLabel =
            statusFilter === 'nonCompliant' ? 'Non Compliant devices'
            : statusFilter === 'compliant' ? 'Compliant devices'
            : statusFilter === 'na' ? 'NA devices'
            : '';

        let excelFile: string | null = null;
        let excelFileName: string | null = null;
        if (generateExcel) {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Application Compliance');

            const columns: Partial<ExcelJS.Column>[] = [
                { header: 'Sr. No.', key: 'srNo', width: 8 },
                { header: 'Compute Name', key: 'computeName', width: 20 },
                { header: 'Asset ID', key: 'assetId', width: 22 },
                { header: 'Serial No', key: 'serialNo', width: 16 },
                { header: 'Make', key: 'make', width: 14 },
                { header: 'Model', key: 'model', width: 26 },
                { header: 'Employee Name', key: 'employeeName', width: 28 },
                { header: 'Employee No', key: 'employeeNo', width: 14 },
                { header: 'Overall Status', key: 'overallStatus', width: 16 },
                { header: 'Compliant Apps', key: 'compliantApps', width: 16 },
                { header: 'Non Compliant Apps', key: 'nonCompliantApps', width: 20 },
                { header: 'NA Apps', key: 'naApps', width: 10 },
            ];
            appNames.forEach((n, i) => {
                columns.push(
                    { header: `${n} - Status`, key: `app${i}Status`, width: Math.max(16, n.length + 10) },
                    { header: `${n} - Version`, key: `app${i}Version`, width: Math.max(16, n.length + 10) },
                );
            });
            const legacyShown = LEGACY_FIELDS.filter(f => finalRows.some(r => r.legacy[f.key] !== ''));
            legacyShown.forEach(f => columns.push({ header: f.header, key: `legacy_${f.key}`, width: 26 }));

            ws.columns = columns;
            const head = ws.getRow(1);
            head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
            ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 2 }];

            for (const r of finalRows) {
                const rowObj: Record<string, any> = {
                    srNo: r.srNo,
                    computeName: r.computeName,
                    assetId: r.assetId,
                    serialNo: r.serialNo,
                    make: r.make,
                    model: r.model,
                    employeeName: r.employeeName,
                    employeeNo: r.employeeNo,
                    overallStatus: r.overallStatus,
                    compliantApps: r.compliantApps,
                    nonCompliantApps: r.nonCompliantApps,
                    naApps: r.naApps,
                };
                appNames.forEach((n, i) => {
                    const a = r.applications.find(x => x.applicationName === n);
                    rowObj[`app${i}Status`] = a ? a.status : '';
                    rowObj[`app${i}Version`] = a ? a.version : '';
                });
                legacyShown.forEach(f => {
                    rowObj[`legacy_${f.key}`] = r.legacy[f.key];
                });
                ws.addRow(rowObj);
            }

            // Employee numbers and serial numbers must stay text
            ws.getColumn('employeeNo').numFmt = '@';
            ws.getColumn('serialNo').numFmt = '@';

            const buffer = await wb.xlsx.writeBuffer();
            excelFileName = `Application_Compliance_Report_${dateStr}.xlsx`;
            excelFile = await context.files.write({
                fileName: excelFileName,
                data: Buffer.from(buffer as ArrayBuffer),
            });
        }

        let htmlBody: string | null = null;
        if (generateEmailTemplate) {
            htmlBody = buildHtml({
                title,
                dateStr,
                topText,
                hasExcel: generateExcel,
                filterLabel,
                totalDevices,
                compliantDevices,
                nonCompliantDevices,
                naDevices,
                shownRows,
            });
        }

        return {
            title,
            reportDate: dateStr,
            countFromApi: apiCount,
            apiRecordCount: raw.length,
            skippedRows,
            applications: appNames,
            totalDevices,
            compliantDevices,
            nonCompliantDevices,
            naDevices,
            rowsInEmail: generateEmailTemplate ? shownRows.length : 0,
            rows: finalRows,
            hasData: finalRows.length > 0,
            subject: `${title}${filterLabel ? ` (${filterLabel})` : ''} - ${dateStr}`,
            htmlBody,
            excelFile,
            excelFileName,
        };
    },
});
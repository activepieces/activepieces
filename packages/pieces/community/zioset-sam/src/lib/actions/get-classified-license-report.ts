import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import ExcelJS from 'exceljs';

// ---------------------------------------------------------------------------
// API settings: the only place to change when the no-pagination API is ready.
// Today (testing): the paginated API. perPage is taken from the count API so
// every row comes in one call (fallback: FALLBACK_PER_PAGE).
// Later: set REPORT_ENDPOINT to the new path, USE_COUNT_API = false and PAGING = {}.
// status comes from the dropdown automatically.
// ---------------------------------------------------------------------------
const REPORT_ENDPOINT = '/normalization/getProductDetialsUpdateByLimit';
const COUNT_ENDPOINT = '/normalization/getProductDetialsUpdateCount';
const USE_COUNT_API = true;
const FALLBACK_PER_PAGE = 10000;
const PAGING: Record<string, string> = { pageNo: '1', sortDir: 'desc' }; // perPage is added automatically

const ALL_STATUSES = ['PENDING', 'MANUALLY_APPROVED', 'AUTO_APPROVED', 'REJECTED'];
const STATUS_LABEL: Record<string, string> = {
    ALL: 'All Statuses',
    PENDING: 'Pending',
    MANUALLY_APPROVED: 'Manually Approved',
    AUTO_APPROVED: 'Auto Approved',
    REJECTED: 'Rejected',
};

const esc = (s: any) =>
    String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const textToHtml = (s: string) => esc(s).replace(/\r?\n/g, '<br>');
const num = (n: any) => Number(n ?? 0).toLocaleString('en-IN');
const txt = (v: any) => (v === null || v === undefined ? '' : String(v).trim());
const dash = (s: any) => (txt(s) === '' ? '-' : txt(s));

const reportDate = () =>
    new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }).replace(/\//g, '-');

const HAS_TZ = /(Z|[+-]\d{2}:?\d{2})$/i;

// "2026-10-19T00:00:00.000+00:00" -> IST -> "19-10-2026" (date only)
const fmtDate = (v: any): string => {
    const s = txt(v);
    if (!s) return '';
    if (HAS_TZ.test(s)) {
        const ms = Date.parse(s);
        if (Number.isNaN(ms)) return s;
        const iso = new Date(ms + 330 * 60 * 1000).toISOString();
        return `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}`;
    }
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
};
const toMs = (v: any): number => {
    const s = txt(v);
    if (!s) return 0;
    const ms = HAS_TZ.test(s) ? Date.parse(s) : Date.parse(s.replace(' ', 'T') + 'Z') - 330 * 60 * 1000;
    return Number.isNaN(ms) ? 0 : ms;
};

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

const cmpText = (x: string, y: string) => {
    if (!x && !y) return 0;
    if (!x) return 1; // empty values always at the end
    if (!y) return -1;
    return x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
};

const statusClass = (s: string) =>
    s === 'PENDING' ? 'st-amber' : s === 'REJECTED' ? 'st-red' : s === 'AUTO_APPROVED' || s === 'MANUALLY_APPROVED' ? 'st-green' : 'st-other';

type SortKey = 'userCount' | 'confidence' | 'product' | 'publisher' | 'updatedDate';

type Row = {
    srNo: number;
    updateId: number;
    productId: number;
    publisher: string;
    product: string;
    currentLicence: string;
    updatedLicence: string;
    confidence: number;
    userCount: number;
    status: string;
    approvedBy: string;
    versions: string;
    addedDate: string;
    updatedDate: string;
    updatedMs: number;
    details: string;
};

function buildHtml(opts: {
    title: string;
    dateStr: string;
    topText: string;
    hasExcel: boolean;
    statusLabel: string;
    totalRows: number;
    totalUsers: number;
    pending: number;
    approved: number;
    rejected: number;
    shownRows: Row[];
}): string {
    const { title, dateStr, topText, hasExcel, statusLabel, totalRows, totalUsers, pending, approved, rejected, shownRows } = opts;

    const tableRows = shownRows
        .map((r, i) => `
<tr class="${i % 2 ? 'alt' : ''}">
  <td data-label="Sr No" class="num">${r.srNo}</td>
  <td data-label="Product" class="name">${esc(r.product)}</td>
  <td data-label="Publisher">${esc(dash(r.publisher))}</td>
  <td data-label="Current Licence">${esc(dash(r.currentLicence))}</td>
  <td data-label="Updated Licence">${esc(dash(r.updatedLicence))}</td>
  <td data-label="Confidence" class="num">${Math.round(r.confidence * 100)}%</td>
  <td data-label="Users" class="num">${num(r.userCount)}</td>
  <td data-label="Status"><span class="badge ${statusClass(r.status)}">${esc(STATUS_LABEL[r.status] ?? r.status)}</span></td>
</tr>`)
        .join('');

    const emptyRow = shownRows.length === 0
        ? `<tr><td colspan="8" style="padding:18px;text-align:center;color:#64748b;">No records found for the selected status.</td></tr>`
        : '';

    const truncated = totalRows > shownRows.length;
    const note = truncated
        ? `Showing the first ${num(shownRows.length)} of ${num(totalRows)} records.${hasExcel ? ' The complete list is attached as an Excel file with this email.' : ''}`
        : hasExcel && shownRows.length > 0
        ? 'The detailed data (including the reason for each change) is attached as an Excel file with this email.'
        : '';

    const intro = topText.trim() !== '' ? `<div class="intro">${textToHtml(topText.trim())}</div>` : '';

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
  .k-tot .v{color:#1d4ed8;} .k-pen .v{color:#d97706;} .k-ok .v{color:#16a34a;} .k-bad .v{color:#dc2626;} .k-usr .v{color:#7c3aed;}
  table.data{width:100%;border-collapse:collapse;font-size:13px;}
  table.data th{background:#eef2ff;color:#3730a3;text-align:left;padding:10px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.4px;}
  table.data td{padding:9px 8px;border-bottom:1px solid #e2e8f0;vertical-align:middle;word-break:break-word;}
  table.data tr.alt td{background:#fafbff;}
  td.num,th.num{text-align:right;}
  td.name{font-weight:600;}
  .badge{display:inline-block;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;}
  .st-amber{background:#fef3c7;color:#b45309;} .st-red{background:#fee2e2;color:#b91c1c;}
  .st-green{background:#dcfce7;color:#15803d;} .st-other{background:#e2e8f0;color:#475569;}
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
      <div class="tags"><span class="tag">${esc(statusLabel)}</span></div>
      <table class="kpis" role="presentation"><tr>
        <td class="kpi k-tot"><span class="v">${num(totalRows)}</span><span class="l">Records</span></td>
        <td class="kpi k-pen"><span class="v">${num(pending)}</span><span class="l">Pending</span></td>
        <td class="kpi k-ok"><span class="v">${num(approved)}</span><span class="l">Approved</span></td>
        <td class="kpi k-bad"><span class="v">${num(rejected)}</span><span class="l">Rejected</span></td>
        <td class="kpi k-usr"><span class="v">${num(totalUsers)}</span><span class="l">Users</span></td>
      </tr></table>

      <table class="data">
        <thead><tr>
          <th class="num">Sr No</th><th>Product</th><th>Publisher</th><th>Current Licence</th><th>Updated Licence</th>
          <th class="num">Confidence</th><th class="num">Users</th><th>Status</th>
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

export const productLicenceUpdateReport = createAction({
    auth: zioSetAuth,
    name: 'classified_license_report',
    displayName: 'Get Classified License Report',
    description: 'Gets the product licence type update requests by status (current and updated licence type, confidence, users, approval). Optionally builds an Excel file and a responsive email body',
    aiMetadata: {
        description:
            'Reads the product licence type update (normalization) requests from ZioSet for the chosen Status: Pending, Manually Approved, Auto Approved, Rejected or All. ' +
            'The number of records for the status is read from the count API and used as perPage, so all records come in one call. ' +
            'Returns one row for each request with Publisher, Product, Current Licence Type, Updated Licence Type, Confidence (0 to 1), User Count, Status, Approved By, Versions, Added Date, Updated Date (dd-mm-yyyy) and Details (the reason). ' +
            'Totals: number of records, total users and how many are Pending, Approved (manual or auto) and Rejected. ' +
            'If there is no data for the status, the report is empty and hasData is false. ' +
            'The action uses all data returned by the API and applies no record limit. ' +
            'Options: status, sort column, rows in email (empty or 0 means all rows, which is the default), email top text (optional message shown at the very top of the email, above the report), Excel on/off, email template on/off. ' +
            'The optional Excel file always has all rows and all fields. The optional HTML email body has KPI cards (always based on all rows) and a table, ' +
            'limited to the first N rows of the chosen sort order when Rows In Email is set. ' +
            'It only reads data and builds report files, so repeating the call with the same input is safe. ' +
            'Use the VulnerabilityApplications, EolApplications and EosApplications actions for application risk reports.',
        idempotent: true,
    },
    props: {
        title: Property.ShortText({
            displayName: 'Report Title',
            required: false,
            defaultValue: 'Classified License Report',
        }),
        emailTopText: Property.LongText({
            displayName: 'Email Top Text',
            description: 'Optional message shown at the very top of the email, above the report. Example: Dear Sir, please find the product licence update report below. Leave empty to show nothing.',
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            required: true,
            defaultValue: 'PENDING',
            options: {
                options: [
                    { label: 'Pending', value: 'PENDING' },
                    { label: 'Manually Approved', value: 'MANUALLY_APPROVED' },
                    { label: 'Auto Approved', value: 'AUTO_APPROVED' },
                    { label: 'Rejected', value: 'REJECTED' },
                    { label: 'All Statuses', value: 'ALL' },
                ],
            },
        }),
        sortBy: Property.StaticDropdown({
            displayName: 'Sort By',
            required: false,
            defaultValue: 'userCount',
            options: {
                options: [
                    { label: 'User Count (high to low)', value: 'userCount' },
                    { label: 'Confidence (high to low)', value: 'confidence' },
                    { label: 'Product', value: 'product' },
                    { label: 'Publisher', value: 'publisher' },
                    { label: 'Updated Date (latest first)', value: 'updatedDate' },
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
        const title = context.propsValue.title || 'Classified License Report';
        const topText = String(context.propsValue.emailTopText ?? '');
        const statusChoice = String(context.propsValue.status || 'PENDING');
        const sortBy = ((context.propsValue.sortBy as string) || 'userCount') as SortKey;
        const emailRowLimit = Number(context.propsValue.emailRowLimit) > 0 ? Math.floor(Number(context.propsValue.emailRowLimit)) : 0; // 0 = all rows
        const generateExcel = context.propsValue.generateExcel ?? true;
        const generateEmailTemplate = context.propsValue.generateEmailTemplate ?? true;

        const headers = { authorization: `Bearer ${context.auth.access_token}` };
        const statuses = statusChoice === 'ALL' ? ALL_STATUSES : [statusChoice];

        const counts: Record<string, number> = {};
        const raw: any[] = [];

        for (const st of statuses) {
            // Step 1: how many records for this status (the count API returns a plain number)
            const query: Record<string, string> = { ...PAGING, status: st };
            let apiCount = 0;
            if (USE_COUNT_API) {
                try {
                    const c = await httpClient.sendRequest<any>({
                        method: HttpMethod.GET,
                        url: `${baseUrl}${COUNT_ENDPOINT}`,
                        headers,
                        queryParams: { status: st },
                        timeout: 60000,
                    });
                    const body: any = c.body;
                    const n = Number(typeof body === 'string' ? body.trim() : typeof body === 'object' && body ? (body.count ?? body.data ?? body.total) : body);
                    if (Number.isFinite(n) && n >= 0) apiCount = Math.floor(n);
                } catch {
                    apiCount = -1; // unknown, use the fallback
                }
                counts[st] = apiCount;
                if (apiCount === 0) continue; // nothing to fetch for this status
                query['perPage'] = String(apiCount > 0 ? apiCount : FALLBACK_PER_PAGE);
            }

            // Step 2: the records
            const url = `${baseUrl}${REPORT_ENDPOINT}`;
            const res = await httpClient.sendRequest<any>({
                method: HttpMethod.GET,
                url,
                headers,
                queryParams: query,
                timeout: 120000,
            });
            const list = extractList(res.body);
            if (list === null) {
                // Do not return an empty report silently: show what the server really sent
                throw new Error(
                    `Unexpected response from ${url} for status ${st} (status ${res.status}). Expected a list. Response starts with: ${preview(res.body)}`
                );
            }
            raw.push(...list.map(x => ({ ...x, __status: st })));
        }

        const valid = raw.filter(r => r && typeof r === 'object' && txt(r.productName) !== '');
        const skippedRows = raw.length - valid.length;

        const mapped = valid.map(r => ({
            updateId: Number(r.productDetailsUpdateId ?? 0),
            productId: Number(r.productId ?? 0),
            publisher: txt(r.publisherName),
            product: txt(r.productName),
            currentLicence: txt(r.curentLicenceType), // the API spells it "curentLicenceType"
            updatedLicence: txt(r.updatedLicenceType),
            confidence: Number(r.confidenceFactor ?? 0),
            userCount: Number(r.userCount ?? 0),
            status: txt(r.appoved) || r.__status, // the API spells it "appoved"
            approvedBy: txt(r.approvedBy),
            versions: Array.isArray(r.versions) ? r.versions.join(', ') : txt(r.versions),
            addedDate: fmtDate(r.addedDate),
            updatedDate: fmtDate(r.updatedDate),
            updatedMs: toMs(r.updatedDate),
            details: txt(r.details),
        }));

        mapped.sort((a, b) => {
            switch (sortBy) {
                case 'confidence':
                    return b.confidence - a.confidence || b.userCount - a.userCount;
                case 'product':
                    return cmpText(a.product, b.product);
                case 'publisher':
                    return cmpText(a.publisher, b.publisher) || cmpText(a.product, b.product);
                case 'updatedDate':
                    return b.updatedMs - a.updatedMs;
                default:
                    return b.userCount - a.userCount;
            }
        });

        // Sr. No. is assigned after sorting so it always runs 1..N in the shown order
        const finalRows: Row[] = mapped.map((r, i) => ({ srNo: i + 1, ...r }));

        // KPI cards always use all rows
        const totalRows = finalRows.length;
        const totalUsers = finalRows.reduce((s, r) => s + r.userCount, 0);
        const pending = finalRows.filter(r => r.status === 'PENDING').length;
        const approved = finalRows.filter(r => r.status === 'AUTO_APPROVED' || r.status === 'MANUALLY_APPROVED').length;
        const rejected = finalRows.filter(r => r.status === 'REJECTED').length;

        const shownRows = emailRowLimit > 0 ? finalRows.slice(0, emailRowLimit) : finalRows;
        const dateStr = reportDate();
        const statusLabel = STATUS_LABEL[statusChoice] ?? statusChoice;

        let excelFile: string | null = null;
        let excelFileName: string | null = null;
        if (generateExcel) {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Licence Updates');
            ws.columns = [
                { header: 'Sr. No.', key: 'srNo', width: 8 },
                { header: 'Update ID', key: 'updateId', width: 11 },
                { header: 'Product ID', key: 'productId', width: 11 },
                { header: 'Publisher', key: 'publisher', width: 32 },
                { header: 'Product', key: 'product', width: 40 },
                { header: 'Current Licence Type', key: 'currentLicence', width: 20 },
                { header: 'Updated Licence Type', key: 'updatedLicence', width: 20 },
                { header: 'Confidence', key: 'confidence', width: 12 },
                { header: 'User Count', key: 'userCount', width: 12 },
                { header: 'Status', key: 'status', width: 18 },
                { header: 'Approved By', key: 'approvedBy', width: 16 },
                { header: 'Versions', key: 'versions', width: 16 },
                { header: 'Added Date', key: 'addedDate', width: 14 },
                { header: 'Updated Date', key: 'updatedDate', width: 14 },
                { header: 'Details', key: 'details', width: 80 },
            ];
            const head = ws.getRow(1);
            head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
            ws.views = [{ state: 'frozen', ySplit: 1 }];
            finalRows.forEach(r => ws.addRow(r));
            ws.getColumn('confidence').numFmt = '0%';

            const totalRow = ws.addRow({ srNo: '', publisher: 'Total', userCount: totalUsers });
            totalRow.font = { bold: true };
            totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };

            const buffer = await wb.xlsx.writeBuffer();
            excelFileName = `Product_Licence_Update_${statusChoice}_${dateStr}.xlsx`;
            excelFile = await context.files.write({
                fileName: excelFileName,
                data: Buffer.from(buffer as ArrayBuffer),
            });
        }

        let htmlBody: string | null = null;
        if (generateEmailTemplate) {
            htmlBody = buildHtml({ title, dateStr, topText, hasExcel: generateExcel, statusLabel, totalRows, totalUsers, pending, approved, rejected, shownRows });
        }

        return {
            title,
            reportDate: dateStr,
            status: statusChoice,
            countsFromApi: counts,
            apiRecordCount: raw.length,
            skippedRows,
            totalRecords: totalRows,
            totalUsers,
            pendingCount: pending,
            approvedCount: approved,
            rejectedCount: rejected,
            rowsInEmail: generateEmailTemplate ? shownRows.length : 0,
            rows: finalRows,
            hasData: finalRows.length > 0,
            subject: `${title} (${statusLabel}) - ${dateStr}`,
            htmlBody,
            excelFile,
            excelFileName,
        };
    },
});
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import ExcelJS from 'exceljs';

// ---------------------------------------------------------------------------
// API settings: the only place to change when the no-pagination API is ready.
// Today (testing): the paginated API. perPage is set high so every application fits.
// Later: set ENDPOINT to the new path and keep only licenceType (or {}); the action
// does not apply any limit of its own, it uses whatever the API returns.
// ---------------------------------------------------------------------------
const ENDPOINT = '/software-risk-new/blacklist/applicationByLimit';
const QUERY: Record<string, string> = { pageNo: '1', perPage: '5000', licenceType: 'All' };

const esc = (s: any) =>
    String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const textToHtml = (s: string) => esc(s).replace(/\r?\n/g, '<br>');
const num = (n: any) => Number(n ?? 0).toLocaleString('en-IN');
const dash = (s: any) => (String(s ?? '').trim() === '' ? '-' : String(s).trim());

const reportDate = () =>
    new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }).replace(/\//g, '-');

const HAS_TZ = /(Z|[+-]\d{2}:?\d{2})$/i;

// With Z -> converted to IST. Without Z -> treated as already IST. Result: dd-mm-yyyy hh:mm:ss
const fmtDateTime = (v: any): string => {
    const s = String(v ?? '').trim();
    if (!s) return '';
    if (HAS_TZ.test(s)) {
        const ms = Date.parse(s);
        if (Number.isNaN(ms)) return s;
        const iso = new Date(ms + 330 * 60 * 1000).toISOString();
        return `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)} ${iso.slice(11, 19)}`;
    }
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (!m) return s;
    return `${m[3]}-${m[2]}-${m[1]} ${m[4] ?? '00'}:${m[5] ?? '00'}:${m[6] ?? '00'}`;
};

// Real moment in time (ms), used only for sorting by Updated At
const toMs = (v: any): number => {
    const s = String(v ?? '').trim();
    if (!s) return 0;
    const ms = HAS_TZ.test(s) ? Date.parse(s) : Date.parse(s.replace(' ', 'T') + 'Z') - 330 * 60 * 1000;
    return Number.isNaN(ms) ? 0 : ms;
};

function extractList(body: any): any[] | null {
    let b = body;
    if (typeof b === 'string') {
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

const SEVERITY_RANK: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const sevClass = (s: string) => {
    const k = s.toUpperCase();
    return k === 'CRITICAL' || k === 'HIGH' ? 'sev-high' : k === 'MEDIUM' ? 'sev-med' : k === 'LOW' ? 'sev-low' : 'sev-other';
};
const statusClass = (s: string) => (s === 'Approved' ? 'st-ok' : 'st-pending');

type SortKey = 'software' | 'publisher' | 'severity' | 'dataCount' | 'updatedAt';

type Row = {
    srNo: number;
    softwareName: string;
    publisher: string;
    licenceType: string;
    reason: string;
    severity: string;
    blacklistedBy: string;
    status: string;
    dataCount: number;
    remark: string;
    updatedAt: string;
    updatedMs: number;
    action: string;
};

function buildHtml(opts: {
    title: string;
    dateStr: string;
    topText: string;
    hasExcel: boolean;
    totalApps: number;
    high: number;
    medium: number;
    low: number;
    shownRows: Row[];
}): string {
    const { title, dateStr, topText, hasExcel, totalApps, high, medium, low, shownRows } = opts;

    const tableRows = shownRows
        .map((r, i) => `
<tr class="${i % 2 ? 'alt' : ''}">
  <td data-label="Sr No" class="num">${r.srNo}</td>
  <td data-label="Software" class="name">${esc(r.softwareName)}</td>
  <td data-label="Publisher">${esc(dash(r.publisher))}</td>
  <td data-label="Licence Type">${esc(dash(r.licenceType))}</td>
  <td data-label="Severity"><span class="badge ${sevClass(r.severity)}">${esc(dash(r.severity))}</span></td>
  <td data-label="Status"><span class="badge ${statusClass(r.status)}">${esc(r.status)}</span></td>
  <td data-label="Data Count" class="num">${num(r.dataCount)}</td>
  <td data-label="Updated At">${esc(dash(r.updatedAt))}</td>
</tr>`)
        .join('');

    const truncated = totalApps > shownRows.length;
    const note = truncated
        ? `Showing the first ${num(shownRows.length)} of ${num(totalApps)} applications.${
              hasExcel ? ' The complete list is attached as an Excel file with this email.' : ''
          }`
        : hasExcel
        ? 'The detailed data (reason, blacklisted by, remark) is attached as an Excel file with this email.'
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
  .intro{max-width:960px;margin:0 auto 18px;padding:0 4px;font-size:15px;line-height:1.7;color:#1e293b;word-break:break-word;}
  .card{max-width:960px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,.10);}
  .header{background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#fff;padding:28px 24px;}
  .header h1{margin:0;font-size:22px;font-weight:700;}
  .header p{margin:6px 0 0;font-size:13px;opacity:.9;}
  .content{padding:22px 24px;}
  .kpis{width:100%;border-collapse:separate;border-spacing:10px 0;margin:0 -10px 20px;}
  .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 10px;text-align:center;}
  .kpi .v{font-size:24px;font-weight:700;display:block;}
  .kpi .l{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;}
  .k-app .v{color:#1d4ed8;} .k-high .v{color:#dc2626;} .k-med .v{color:#d97706;} .k-low .v{color:#16a34a;}
  table.data{width:100%;border-collapse:collapse;font-size:13px;}
  table.data th{background:#eef2ff;color:#3730a3;text-align:left;padding:10px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.4px;}
  table.data td{padding:9px 8px;border-bottom:1px solid #e2e8f0;vertical-align:middle;word-break:break-word;}
  table.data tr.alt td{background:#fafbff;}
  td.num,th.num{text-align:right;}
  td.name{font-weight:600;}
  .badge{display:inline-block;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;}
  .sev-high{background:#fee2e2;color:#b91c1c;} .sev-med{background:#fef3c7;color:#b45309;}
  .sev-low{background:#dcfce7;color:#15803d;} .sev-other{background:#e2e8f0;color:#475569;}
  .st-ok{background:#dcfce7;color:#15803d;} .st-pending{background:#e0e7ff;color:#4338ca;}
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
      <table class="kpis" role="presentation"><tr>
        <td class="kpi k-app"><span class="v">${num(totalApps)}</span><span class="l">Applications</span></td>
        <td class="kpi k-high"><span class="v">${num(high)}</span><span class="l">High</span></td>
        <td class="kpi k-med"><span class="v">${num(medium)}</span><span class="l">Medium</span></td>
        <td class="kpi k-low"><span class="v">${num(low)}</span><span class="l">Low</span></td>
      </tr></table>

      <table class="data">
        <thead><tr>
          <th class="num">Sr No</th><th>Software</th><th>Publisher</th><th>Licence Type</th>
          <th>Severity</th><th>Status</th><th class="num">Data Count</th><th>Updated At</th>
        </tr></thead>
        <tbody>${tableRows}</tbody>
      </table>

      ${note ? `<p class="note">${esc(note)}</p>` : ''}
    </div>
    <div class="footer">This is an automated report. Please do not reply to this email.</div>
  </div>
</div>
</body>
</html>`;
}

export const allBlacklistApplication = createAction({
    auth: zioSetAuth,
    name: 'all_blacklist_application',
    displayName: 'All Blacklist Applications',
    description: 'Gets all blacklisted applications (software, publisher, licence type, severity, status, data count). Optionally builds an Excel file and a responsive email body',
    aiMetadata: {
        description:
            'Reads the list of blacklisted applications from ZioSet (all licence types) and returns one row for each application with software name, publisher, licence type, reason, severity, ' +
            'blacklisted by, status (Approved or Pending), data count, remark and updated time (IST), plus totals: number of applications and counts of High, Medium and Low severity. ' +
            'The action uses all data returned by the API and applies no record limit. ' +
            'Options: sort column, rows in email (empty or 0 means all rows), email top text (optional message shown at the very top of the email, above the report), Excel on/off, email template on/off. ' +
            'The optional Excel file always has all rows with a Total row for Data Count. The optional HTML email body has KPI cards (always based on all rows) and a table, ' +
            'limited to the first N rows of the chosen sort order when Rows In Email is set. ' +
            'It only reads data and builds report files, so repeating the call with the same input is safe. ' +
            'Use the Reconsilation Report for product-wise record counts and the Compliance Report for compliant and non-compliant counts.',
        idempotent: true,
    },
    props: {
        title: Property.ShortText({
            displayName: 'Report Title',
            required: false,
            defaultValue: 'Blacklisted Applications Report',
        }),
        emailTopText: Property.LongText({
            displayName: 'Email Top Text',
            description: 'Optional message shown at the very top of the email, above the report. Example: Dear Sir, please find the blacklisted applications report below. Leave empty to show nothing.',
            required: false,
        }),
        sortBy: Property.StaticDropdown({
            displayName: 'Sort By',
            required: false,
            defaultValue: 'severity',
            options: {
                options: [
                    { label: 'Software Name', value: 'software' },
                    { label: 'Publisher', value: 'publisher' },
                    { label: 'Severity (high to low)', value: 'severity' },
                    { label: 'Data Count (high to low)', value: 'dataCount' },
                    { label: 'Updated At (latest first)', value: 'updatedAt' },
                ],
            },
        }),
        emailRowLimit: Property.Number({
            displayName: 'Rows In Email',
            description: 'How many rows to show in the email body. Leave empty or 0 to show all rows. The Excel file always has all rows.',
            required: false,
        }),
        generateExcel: Property.Checkbox({
            displayName: 'Generate Excel',
            description: 'Turn ON to create the Excel file',
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
        const title = context.propsValue.title || 'Blacklisted Applications Report';
        const topText = String(context.propsValue.emailTopText ?? '');
        const sortBy = ((context.propsValue.sortBy as string) || 'severity') as SortKey;
        const emailRowLimit = Number(context.propsValue.emailRowLimit) > 0 ? Math.floor(Number(context.propsValue.emailRowLimit)) : 0;
        const generateExcel = context.propsValue.generateExcel ?? true;
        const generateEmailTemplate = context.propsValue.generateEmailTemplate ?? true;

        const url = `${baseUrl}${ENDPOINT}`;
        const res = await httpClient.sendRequest<any>({
            method: HttpMethod.GET,
            url,
            headers: { authorization: `Bearer ${context.auth.access_token}` },
            queryParams: QUERY,
            timeout: 120000,
        });

        const raw = extractList(res.body);
        if (raw === null) {
            throw new Error(
                `Unexpected response from ${url} (status ${res.status}). Expected a list of applications. Response starts with: ${preview(res.body)}`
            );
        }

        const valid = raw.filter(r => r && String(r.software_name ?? '').trim() !== '');
        const skippedRows = raw.length - valid.length;

        const mapped = valid.map(r => ({
            softwareName: String(r.software_name).trim(),
            publisher: String(r.publisher_name ?? '').trim(),
            licenceType: String(r.licenceType ?? '').trim(),
            reason: String(r.reason ?? '').trim(),
            severity: String(r.severity ?? '').trim().toUpperCase(),
            blacklistedBy: String(r.blacklisted_by ?? '').trim(),
            status: r.approved === true ? 'Approved' : 'Pending',
            dataCount: Number(r.dataCount ?? 0),
            remark: String(r.remark ?? '').trim(),
            updatedAt: fmtDateTime(r.updatedAt),
            updatedMs: toMs(r.updatedAt),
            action: Number(r.dataCount ?? 0) > 0 ? 'View Users' : '-',
        }));

        const cmpText = (x: string, y: string) => {
            if (!x && !y) return 0;
            if (!x) return 1; // empty values always at the end
            if (!y) return -1;
            return x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
        };

        mapped.sort((a, b) => {
            switch (sortBy) {
                case 'dataCount':
                    return b.dataCount - a.dataCount;
                case 'updatedAt':
                    return b.updatedMs - a.updatedMs;
                case 'severity':
                    return (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0) || b.dataCount - a.dataCount;
                case 'publisher':
                    return cmpText(a.publisher, b.publisher);
                default:
                    return cmpText(a.softwareName, b.softwareName);
            }
        });

        // Sr. No. is assigned after sorting so it always runs 1..N in the shown order
        const finalRows: Row[] = mapped.map((r, i) => ({ srNo: i + 1, ...r }));

        // KPI cards and the Total row always use all rows
        const totalApps = finalRows.length;
        const high = finalRows.filter(r => r.severity === 'HIGH' || r.severity === 'CRITICAL').length;
        const medium = finalRows.filter(r => r.severity === 'MEDIUM').length;
        const low = finalRows.filter(r => r.severity === 'LOW').length;
        const totalDataCount = finalRows.reduce((s, r) => s + r.dataCount, 0);

        const shownRows = emailRowLimit > 0 ? finalRows.slice(0, emailRowLimit) : finalRows;
        const dateStr = reportDate();

        let excelFile: string | null = null;
        let excelFileName: string | null = null;
        if (generateExcel) {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Blacklist Applications');
            ws.columns = [
                { header: 'Sr. No.', key: 'srNo', width: 8 },
                { header: 'Software Name', key: 'softwareName', width: 38 },
                { header: 'Publisher', key: 'publisher', width: 32 },
                { header: 'Licence Type', key: 'licenceType', width: 16 },
                { header: 'Reason', key: 'reason', width: 45 },
                { header: 'Severity', key: 'severity', width: 12 },
                { header: 'Blacklisted By', key: 'blacklistedBy', width: 20 },
                { header: 'Status', key: 'status', width: 12 },
                { header: 'Data Count', key: 'dataCount', width: 12 },
                { header: 'Remark', key: 'remark', width: 30 },
                { header: 'Updated At', key: 'updatedAt', width: 22 },
                { header: 'Users / Action', key: 'action', width: 16 },
            ];
            const head = ws.getRow(1);
            head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
            ws.views = [{ state: 'frozen', ySplit: 1 }];
            finalRows.forEach(r => ws.addRow(r));
            const totalRow = ws.addRow({ srNo: '', softwareName: 'Total', dataCount: totalDataCount });
            totalRow.font = { bold: true };
            totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };

            const buffer = await wb.xlsx.writeBuffer();
            excelFileName = `Blacklist_Applications_Report_${dateStr}.xlsx`;
            excelFile = await context.files.write({
                fileName: excelFileName,
                data: Buffer.from(buffer as ArrayBuffer),
            });
        }

        let htmlBody: string | null = null;
        if (generateEmailTemplate) {
            htmlBody = buildHtml({ title, dateStr, topText, hasExcel: generateExcel, totalApps, high, medium, low, shownRows });
        }

        return {
            title,
            reportDate: dateStr,
            apiRecordCount: raw.length,
            skippedRows,
            totalApplications: totalApps,
            highCount: high,
            mediumCount: medium,
            lowCount: low,
            totalDataCount,
            rowsInEmail: generateEmailTemplate ? shownRows.length : 0,
            rows: finalRows,
            hasData: finalRows.length > 0,
            subject: `${title} - ${dateStr}`,
            htmlBody,
            excelFileName,
            excelFile,
        };
    },
});
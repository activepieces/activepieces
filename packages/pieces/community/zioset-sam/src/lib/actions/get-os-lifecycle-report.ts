import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import ExcelJS from 'exceljs';

// ---------------------------------------------------------------------------
// API settings: the only place to change when the no-pagination API is ready.
// Today (testing): the paginated API. perPage is set high so every row fits.
// Later: set REPORT_ENDPOINT to the new path and make PAGING = {}.
// type (operating system) and edition come from the dropdowns automatically.
// ---------------------------------------------------------------------------
const REPORT_ENDPOINT = '/software-risk/getOSLifeCycleByLimit';
const PAGING: Record<string, string> = { pageNo: '1', perPage: '5000' };

// Used only to fill the dropdowns
const OS_LIST_ENDPOINT = '/software-risk/getOSTypeWise';
const EDITION_LIST_ENDPOINT = '/software-risk/getEditionWise';

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

// "2026-10-13" -> "13-10-2026" (date only, no time zone conversion needed)
const fmtDate = (v: any): string => {
    const s = String(v ?? '').trim();
    if (!s) return '';
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
};
// Sort key for a date: "2026-10-13" -> "2026-10-13", empty -> ""
const dateKey = (v: any): string => {
    const m = String(v ?? '').trim().match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : '';
};

function extractList(body: any): any[] | null {
    let b = body;
    if (typeof b === 'string') {
        // An empty body is treated as an empty list (the API may send nothing when there is no data)
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

// Works for the action context auth and for the auth given to dropdown option loaders
const authParts = (auth: any) => ({
    baseUrl: String(auth?.props?.baseUrl ?? auth?.baseUrl ?? '').replace(/\/+$/, ''),
    token: String(auth?.access_token ?? auth?.props?.access_token ?? ''),
});

async function loadNames(auth: any, endpoint: string, query: Record<string, string>): Promise<string[]> {
    const { baseUrl, token } = authParts(auth);
    const res = await httpClient.sendRequest<any>({
        method: HttpMethod.GET,
        url: `${baseUrl}${endpoint}`,
        headers: { authorization: `Bearer ${token}` },
        queryParams: query,
        timeout: 60000,
    });
    const list = extractList(res.body) ?? [];
    return list.map(x => String(x?.name ?? '').trim()).filter(Boolean);
}

const STATUS_RANK: Record<string, number> = { 'END OF LIFE': 3, 'EXTENDED SUPPORT': 2, SUPPORTED: 1 };
const statusClass = (s: string) => {
    const k = s.toUpperCase();
    return k === 'END OF LIFE' ? 'st-red' : k === 'EXTENDED SUPPORT' ? 'st-amber' : k === 'SUPPORTED' ? 'st-green' : 'st-other';
};

type SortKey = 'devices' | 'name' | 'releaseDate' | 'endOfLife' | 'supportStatus';

type Row = {
    srNo: number;
    operatingSystem: string;
    edition: string;
    version: string;
    build: string;
    releaseDate: string;
    endOfSupport: string;
    endOfLife: string;
    extendedSupport: string;
    supportStatus: string;
    lts: string;
    devices: number;
    users: string;
    releaseKey: string;
    eolKey: string;
};

function buildHtml(opts: {
    title: string;
    dateStr: string;
    topText: string;
    hasExcel: boolean;
    osType: string;
    edition: string;
    totalRows: number;
    totalDevices: number;
    supported: number;
    extended: number;
    endOfLife: number;
    shownRows: Row[];
}): string {
    const { title, dateStr, topText, hasExcel, osType, edition, totalRows, totalDevices, supported, extended, endOfLife, shownRows } = opts;

    const tableRows = shownRows
        .map((r, i) => `
<tr class="${i % 2 ? 'alt' : ''}">
  <td data-label="Sr No" class="num">${r.srNo}</td>
  <td data-label="Operating System" class="name">${esc(r.operatingSystem)}</td>
  <td data-label="Version">${esc(dash(r.version))}</td>
  <td data-label="Build">${esc(dash(r.build))}</td>
  <td data-label="Release Date">${esc(dash(r.releaseDate))}</td>
  <td data-label="End of Life">${esc(dash(r.endOfLife))}</td>
  <td data-label="Support Status"><span class="badge ${statusClass(r.supportStatus)}">${esc(dash(r.supportStatus))}</span></td>
  <td data-label="Devices" class="num">${num(r.devices)}</td>
</tr>`)
        .join('');

    const emptyRow = shownRows.length === 0
        ? `<tr><td colspan="8" style="padding:18px;text-align:center;color:#64748b;">No data found for the selected operating system and edition.</td></tr>`
        : '';

    const truncated = totalRows > shownRows.length;
    const note = truncated
        ? `Showing the first ${num(shownRows.length)} of ${num(totalRows)} rows.${
              hasExcel ? ' The complete list is attached as an Excel file with this email.' : ''
          }`
        : hasExcel && shownRows.length > 0
        ? 'The detailed data (edition, end of support, extended support, LTS) is attached as an Excel file with this email.'
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
  .intro{max-width:980px;margin:0 auto 18px;padding:0 4px;font-size:15px;line-height:1.7;color:#1e293b;word-break:break-word;}
  .card{max-width:980px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,.10);}
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
  .k-dev .v{color:#1d4ed8;} .k-sup .v{color:#16a34a;} .k-ext .v{color:#d97706;} .k-eol .v{color:#dc2626;}
  table.data{width:100%;border-collapse:collapse;font-size:13px;}
  table.data th{background:#eef2ff;color:#3730a3;text-align:left;padding:10px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.4px;}
  table.data td{padding:9px 8px;border-bottom:1px solid #e2e8f0;vertical-align:middle;word-break:break-word;}
  table.data tr.alt td{background:#fafbff;}
  td.num,th.num{text-align:right;}
  td.name{font-weight:600;}
  .badge{display:inline-block;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;}
  .st-red{background:#fee2e2;color:#b91c1c;} .st-amber{background:#fef3c7;color:#b45309;}
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
      <div class="tags">
        <span class="tag">${esc(osType)}</span>
        <span class="tag">${esc(edition)}</span>
      </div>
      <table class="kpis" role="presentation"><tr>
        <td class="kpi k-dev"><span class="v">${num(totalDevices)}</span><span class="l">Devices</span></td>
        <td class="kpi k-sup"><span class="v">${num(supported)}</span><span class="l">Supported</span></td>
        <td class="kpi k-ext"><span class="v">${num(extended)}</span><span class="l">Extended Support</span></td>
        <td class="kpi k-eol"><span class="v">${num(endOfLife)}</span><span class="l">End of Life</span></td>
      </tr></table>

      <table class="data">
        <thead><tr>
          <th class="num">Sr No</th><th>Operating System</th><th>Version</th><th>Build</th>
          <th>Release Date</th><th>End of Life</th><th>Support Status</th><th class="num">Devices</th>
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

export const osLifecycleReport = createAction({
    auth: zioSetAuth,
    name: 'os_lifecycle_report',
    displayName: 'OsLifecycleReport',
    description: 'Gets the operating system lifecycle report by operating system and edition (build, release date, end of support, end of life, support status, devices). Optionally builds an Excel file and a responsive email body',
    aiMetadata: {
        description:
            'Reads the operating system lifecycle report from ZioSet for the chosen Operating System (for example Windows or MAC) and Edition (for example Pro, Enterprise or Sonoma). ' +
            'The operating system list and the edition list are loaded from ZioSet, and the edition list depends on the chosen operating system. ' +
            'Returns one row for each OS build with Operating System name, Edition, Version, Build, Release Date, End of Support, End of Life, Extended Support, Support Status, LTS and Devices, ' +
            'plus totals: total devices and the number of rows that are Supported, in Extended Support and End of Life. If there is no data for the selection, the report is empty and hasData is false. ' +
            'The action uses all data returned by the API and applies no record limit. ' +
            'Options: operating system, edition, sort column, rows in email (empty or 0 means all rows), email top text (optional message shown at the very top of the email, above the report), Excel on/off, email template on/off. ' +
            'The optional Excel file always has all rows with a Total row for Devices. The optional HTML email body has KPI cards (always based on all rows) and a table, ' +
            'limited to the first N rows of the chosen sort order when Rows In Email is set. ' +
            'It only reads data and builds report files, so repeating the call with the same input is safe. ' +
            'Use the EolApplications and EosApplications actions for application end of life and end of support.',
        idempotent: true,
    },
    props: {
        title: Property.ShortText({
            displayName: 'Report Title',
            required: false,
            defaultValue: 'OS Lifecycle Report',
        }),
        emailTopText: Property.LongText({
            displayName: 'Email Top Text',
            description: 'Optional message shown at the very top of the email, above the report. Example: Dear Sir, please find the OS lifecycle report below. Leave empty to show nothing.',
            required: false,
        }),
        osType: Property.Dropdown({
            auth: zioSetAuth,
            displayName: 'Operating System',
            description: 'List is loaded from ZioSet',
            required: true,
            refreshers: [],
            options: async ({ auth }: any) => {
                if (!auth) {
                    return { disabled: true, options: [], placeholder: 'Connect your ZioSet account first' };
                }
                try {
                    const names = await loadNames(auth, OS_LIST_ENDPOINT, {});
                    return { disabled: false, options: names.map(n => ({ label: n, value: n })) };
                } catch (e: any) {
                    return { disabled: true, options: [], placeholder: `Could not load operating systems: ${e?.message ?? e}` };
                }
            },
        }),
        edition: Property.Dropdown({
            auth: zioSetAuth,
            displayName: 'Edition',
            description: 'List is loaded from ZioSet for the selected operating system',
            required: true,
            refreshers: ['osType'],
            options: async ({ auth, osType }: any) => {
                if (!auth) {
                    return { disabled: true, options: [], placeholder: 'Connect your ZioSet account first' };
                }
                if (!osType) {
                    return { disabled: true, options: [], placeholder: 'Select Operating System first' };
                }
                try {
                    const names = await loadNames(auth, EDITION_LIST_ENDPOINT, { type: String(osType) });
                    return { disabled: false, options: names.map(n => ({ label: n, value: n })) };
                } catch (e: any) {
                    return { disabled: true, options: [], placeholder: `Could not load editions: ${e?.message ?? e}` };
                }
            },
        }),
        sortBy: Property.StaticDropdown({
            displayName: 'Sort By',
            required: false,
            defaultValue: 'devices',
            options: {
                options: [
                    { label: 'Devices (high to low)', value: 'devices' },
                    { label: 'Operating System', value: 'name' },
                    { label: 'Release Date (latest first)', value: 'releaseDate' },
                    { label: 'End of Life (earliest first)', value: 'endOfLife' },
                    { label: 'Support Status (End of Life first)', value: 'supportStatus' },
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
        const title = context.propsValue.title || 'OS Lifecycle Report';
        const topText = String(context.propsValue.emailTopText ?? '');
        const osType = String(context.propsValue.osType ?? '');
        const edition = String(context.propsValue.edition ?? '');
        const sortBy = ((context.propsValue.sortBy as string) || 'devices') as SortKey;
        const emailRowLimit = Number(context.propsValue.emailRowLimit) > 0 ? Math.floor(Number(context.propsValue.emailRowLimit)) : 0; // 0 = all rows
        const generateExcel = context.propsValue.generateExcel ?? true;
        const generateEmailTemplate = context.propsValue.generateEmailTemplate ?? true;

        if (!osType || !edition) {
            throw new Error('Please select both Operating System and Edition.');
        }

        const url = `${baseUrl}${REPORT_ENDPOINT}`;
        const res = await httpClient.sendRequest<any>({
            method: HttpMethod.GET,
            url,
            headers: { authorization: `Bearer ${context.auth.access_token}` },
            queryParams: { ...PAGING, type: osType, edition },
            timeout: 120000,
        });

        const raw = extractList(res.body);
        if (raw === null) {
            // Do not return an empty report silently: show what the server really sent
            throw new Error(
                `Unexpected response from ${url} (status ${res.status}). Expected a list. Response starts with: ${preview(res.body)}`
            );
        }

        const valid = raw.filter(r => r && String(r.name ?? '').trim() !== '');
        const skippedRows = raw.length - valid.length;

        const mapped = valid.map(r => {
            const devices = Number(r.dataCount ?? 0);
            return {
                operatingSystem: String(r.name).trim(),
                edition: String(r.edition ?? edition).trim(),
                version: String(r.displayVersion ?? r.version ?? '').trim(),
                build: String(r.build ?? '').trim(),
                releaseDate: fmtDate(r.releaseDate),
                endOfSupport: fmtDate(r.endOfSupport),
                endOfLife: fmtDate(r.endOfLife),
                extendedSupport: fmtDate(r.extendedSupportEndDate),
                supportStatus: String(r.supportStatus ?? '').trim(),
                lts: r.lts === true ? 'Yes' : 'No',
                devices,
                users: devices > 0 ? 'View Users' : '-',
                releaseKey: dateKey(r.releaseDate),
                eolKey: dateKey(r.endOfLife),
            };
        });

        const cmpText = (x: string, y: string) => {
            if (!x && !y) return 0;
            if (!x) return 1; // empty values always at the end
            if (!y) return -1;
            return x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
        };

        mapped.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return cmpText(a.operatingSystem, b.operatingSystem) || cmpText(a.build, b.build);
                case 'releaseDate':
                    return b.releaseKey.localeCompare(a.releaseKey);
                case 'endOfLife': {
                    if (!a.eolKey && !b.eolKey) return 0;
                    if (!a.eolKey) return 1;
                    if (!b.eolKey) return -1;
                    return a.eolKey.localeCompare(b.eolKey);
                }
                case 'supportStatus':
                    return (STATUS_RANK[b.supportStatus.toUpperCase()] ?? 0) - (STATUS_RANK[a.supportStatus.toUpperCase()] ?? 0) || b.devices - a.devices;
                default:
                    return b.devices - a.devices;
            }
        });

        // Sr. No. is assigned after sorting so it always runs 1..N in the shown order
        const finalRows: Row[] = mapped.map((r, i) => ({ srNo: i + 1, ...r }));

        // KPI cards and the Total row always use all rows
        const totalRows = finalRows.length;
        const totalDevices = finalRows.reduce((s, r) => s + r.devices, 0);
        const countStatus = (name: string) => finalRows.filter(r => r.supportStatus.toUpperCase() === name).length;
        const supported = countStatus('SUPPORTED');
        const extended = countStatus('EXTENDED SUPPORT');
        const endOfLife = countStatus('END OF LIFE');

        const shownRows = emailRowLimit > 0 ? finalRows.slice(0, emailRowLimit) : finalRows;
        const dateStr = reportDate();

        let excelFile: string | null = null;
        let excelFileName: string | null = null;
        if (generateExcel) {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('OS Lifecycle');
            ws.columns = [
                { header: 'Sr. No.', key: 'srNo', width: 8 },
                { header: 'Operating System', key: 'operatingSystem', width: 32 },
                { header: 'Edition', key: 'edition', width: 18 },
                { header: 'Version', key: 'version', width: 12 },
                { header: 'Build', key: 'build', width: 12 },
                { header: 'Release Date', key: 'releaseDate', width: 14 },
                { header: 'End of Support', key: 'endOfSupport', width: 16 },
                { header: 'End of Life', key: 'endOfLife', width: 14 },
                { header: 'Extended Support', key: 'extendedSupport', width: 18 },
                { header: 'Support Status', key: 'supportStatus', width: 18 },
                { header: 'LTS', key: 'lts', width: 8 },
                { header: 'Devices', key: 'devices', width: 10 },
                { header: 'Users', key: 'users', width: 14 },
            ];
            const head = ws.getRow(1);
            head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
            ws.views = [{ state: 'frozen', ySplit: 1 }];
            finalRows.forEach(r => ws.addRow(r));
            const totalRow = ws.addRow({ srNo: '', operatingSystem: 'Total', devices: totalDevices });
            totalRow.font = { bold: true };
            totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };

            const buffer = await wb.xlsx.writeBuffer();
            const safe = (s: string) => s.replace(/[^A-Za-z0-9]+/g, '_');
            excelFileName = `OS_Lifecycle_Report_${safe(osType)}_${safe(edition)}_${dateStr}.xlsx`;
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
                osType,
                edition,
                totalRows,
                totalDevices,
                supported,
                extended,
                endOfLife,
                shownRows,
            });
        }

        return {
            title,
            reportDate: dateStr,
            osType,
            edition,
            apiRecordCount: raw.length,
            skippedRows,
            totalRows,
            totalDevices,
            supportedCount: supported,
            extendedSupportCount: extended,
            endOfLifeCount: endOfLife,
            rowsInEmail: generateEmailTemplate ? shownRows.length : 0,
            rows: finalRows,
            hasData: finalRows.length > 0,
            subject: `${title} (${osType} - ${edition}) - ${dateStr}`,
            htmlBody,
            excelFileName,
            excelFile,
        };
    },
});
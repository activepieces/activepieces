import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import ExcelJS from 'exceljs';

// ---------------------------------------------------------------------------
// API settings: the only place to change if the endpoint path changes.
// This API returns the full list (no pagination), so there is no paging query.
// ---------------------------------------------------------------------------
const ENDPOINT = '/system/getOSBuild';

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

function extractList(body: any): any[] | null {
    let b = body;
    if (typeof b === 'string') {
        // An empty body is treated as an empty list
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

type SortKey = 'count' | 'osName' | 'buildName';

type Row = {
    srNo: number;
    osName: string;
    buildName: string;
    count: number;
    share: number;
};

const cmpText = (x: string, y: string) => {
    if (!x && !y) return 0;
    if (!x) return 1; // empty values always at the end
    if (!y) return -1;
    return x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
};

function buildHtml(opts: {
    title: string;
    dateStr: string;
    topText: string;
    hasExcel: boolean;
    totalBuilds: number;
    totalOs: number;
    totalCount: number;
    shownRows: Row[];
}): string {
    const { title, dateStr, topText, hasExcel, totalBuilds, totalOs, totalCount, shownRows } = opts;

    const tableRows = shownRows
        .map((r, i) => `
<tr class="${i % 2 ? 'alt' : ''}">
  <td data-label="S No" class="num">${r.srNo}</td>
  <td data-label="OS Name" class="name">${esc(dash(r.osName))}</td>
  <td data-label="Build Name">${esc(dash(r.buildName))}</td>
  <td data-label="Count" class="num">${num(r.count)}</td>
  <td data-label="Share">
    <div class="track"><div class="fill" style="width:${Math.min(100, r.share)}%"></div></div>
    <span class="pct">${r.share}%</span>
  </td>
</tr>`)
        .join('');

    const emptyRow = shownRows.length === 0
        ? `<tr><td colspan="5" style="padding:18px;text-align:center;color:#64748b;">No data found.</td></tr>`
        : '';

    const truncated = totalBuilds > shownRows.length;
    const note = truncated
        ? `Showing the first ${num(shownRows.length)} of ${num(totalBuilds)} builds.${
              hasExcel ? ' The complete list is attached as an Excel file with this email.' : ''
          }`
        : hasExcel && shownRows.length > 0
        ? 'The detailed data is attached as an Excel file with this email.'
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
  .intro{max-width:860px;margin:0 auto 18px;padding:0 4px;font-size:15px;line-height:1.7;color:#1e293b;word-break:break-word;}
  .card{max-width:860px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,.10);}
  .header{background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#fff;padding:28px 24px;}
  .header h1{margin:0;font-size:22px;font-weight:700;}
  .header p{margin:6px 0 0;font-size:13px;opacity:.9;}
  .content{padding:22px 24px;}
  .kpis{width:100%;border-collapse:separate;border-spacing:10px 0;margin:0 -10px 20px;}
  .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 10px;text-align:center;}
  .kpi .v{font-size:24px;font-weight:700;display:block;}
  .kpi .l{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;}
  .k-cnt .v{color:#1d4ed8;} .k-os .v{color:#7c3aed;} .k-bld .v{color:#16a34a;}
  table.data{width:100%;border-collapse:collapse;font-size:14px;}
  table.data th{background:#eef2ff;color:#3730a3;text-align:left;padding:10px 12px;font-size:12px;text-transform:uppercase;letter-spacing:.4px;}
  table.data td{padding:10px 12px;border-bottom:1px solid #e2e8f0;vertical-align:middle;word-break:break-word;}
  table.data tr.alt td{background:#fafbff;}
  td.num,th.num{text-align:right;}
  td.name{font-weight:600;}
  .track{display:inline-block;width:90px;height:8px;background:#e2e8f0;border-radius:6px;overflow:hidden;vertical-align:middle;}
  .fill{height:8px;background:linear-gradient(90deg,#6366f1,#4f46e5);}
  .pct{font-size:12px;color:#475569;margin-left:6px;}
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
        <td class="kpi k-cnt"><span class="v">${num(totalCount)}</span><span class="l">Total Count</span></td>
        <td class="kpi k-os"><span class="v">${num(totalOs)}</span><span class="l">OS Names</span></td>
        <td class="kpi k-bld"><span class="v">${num(totalBuilds)}</span><span class="l">Builds</span></td>
      </tr></table>

      <table class="data">
        <thead><tr>
          <th class="num">S No</th><th>OS Name</th><th>Build Name</th><th class="num">Count</th><th>Share</th>
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

export const osBuildReport = createAction({
    auth: zioSetAuth,
    name: 'os_build_report',
    displayName: 'OsBuildReport',
    description: 'Gets the OS build wise system count (OS name, build name and count). Optionally builds an Excel file and a responsive email body',
    aiMetadata: {
        description:
            'Reads the OS build report from ZioSet (/system/getOSBuild) and returns one row for each OS name and build (for example Microsoft Windows 11 Pro, build 26200.9725) with its Count (number of systems) and share of the total in percent, ' +
            'plus totals: total count, number of distinct OS names and number of builds. ' +
            'If there is no data, the report is empty and hasData is false. ' +
            'The action uses all data returned by the API and applies no record limit. ' +
            'Options: sort column, rows in email (empty or 0 means all rows), email top text (optional message shown at the very top of the email, above the report), Excel on/off, email template on/off. ' +
            'The optional Excel file always has all rows with a Total row (S No, OS Name, Build Name, Count). The optional HTML email body has KPI cards (always based on all rows) and a table with a share bar, ' +
            'limited to the first N rows of the chosen sort order when Rows In Email is set. ' +
            'It only reads data and builds report files, so repeating the call with the same input is safe. ' +
            'Use the OsLifecycleReport action for OS end of life and support status.',
        idempotent: true,
    },
    props: {
        title: Property.ShortText({
            displayName: 'Report Title',
            required: false,
            defaultValue: 'OS Build Report',
        }),
        emailTopText: Property.LongText({
            displayName: 'Email Top Text',
            description: 'Optional message shown at the very top of the email, above the report. Example: Dear Sir, please find the OS build report below. Leave empty to show nothing.',
            required: false,
        }),
        sortBy: Property.StaticDropdown({
            displayName: 'Sort By',
            required: false,
            defaultValue: 'count',
            options: {
                options: [
                    { label: 'Count (high to low)', value: 'count' },
                    { label: 'OS Name', value: 'osName' },
                    { label: 'Build Name', value: 'buildName' },
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
            description: 'Turn ON to create the Excel file (S No, OS Name, Build Name, Count)',
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
        const title = context.propsValue.title || 'OS Build Report';
        const topText = String(context.propsValue.emailTopText ?? '');
        const sortBy = ((context.propsValue.sortBy as string) || 'count') as SortKey;
        const emailRowLimit = Number(context.propsValue.emailRowLimit) > 0 ? Math.floor(Number(context.propsValue.emailRowLimit)) : 0; // 0 = all rows
        const generateExcel = context.propsValue.generateExcel ?? true;
        const generateEmailTemplate = context.propsValue.generateEmailTemplate ?? true;

        const url = `${baseUrl}${ENDPOINT}`;
        const res = await httpClient.sendRequest<any>({
            method: HttpMethod.GET,
            url,
            headers: { authorization: `Bearer ${context.auth.access_token}` },
            timeout: 120000,
        });

        const raw = extractList(res.body);
        if (raw === null) {
            // Do not return an empty report silently: show what the server really sent
            throw new Error(
                `Unexpected response from ${url} (status ${res.status}). Expected a list. Response starts with: ${preview(res.body)}`
            );
        }

        const valid = raw.filter(r => r && (String(r.osName ?? '').trim() !== '' || String(r.buildName ?? '').trim() !== ''));
        const skippedRows = raw.length - valid.length;

        const mapped = valid.map(r => ({
            osName: String(r.osName ?? '').trim(),
            buildName: String(r.buildName ?? '').trim(),
            count: Number(r.count ?? 0),
        }));

        mapped.sort((a, b) => {
            if (sortBy === 'osName') return cmpText(a.osName, b.osName) || cmpText(b.buildName, a.buildName);
            if (sortBy === 'buildName') return cmpText(a.buildName, b.buildName);
            return b.count - a.count;
        });

        // KPI cards and the Total row always use all rows
        const totalBuilds = mapped.length;
        const totalCount = mapped.reduce((s, r) => s + r.count, 0);
        const totalOs = new Set(mapped.map(r => r.osName).filter(Boolean)).size;
        const share = (c: number) => (totalCount > 0 ? Math.round((c / totalCount) * 1000) / 10 : 0);

        // S No. is assigned after sorting so it always runs 1..N in the shown order
        const finalRows: Row[] = mapped.map((r, i) => ({ srNo: i + 1, ...r, share: share(r.count) }));

        const shownRows = emailRowLimit > 0 ? finalRows.slice(0, emailRowLimit) : finalRows;
        const dateStr = reportDate();

        let excelFile: string | null = null;
        let excelFileName: string | null = null;
        if (generateExcel) {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('OS Build');
            ws.columns = [
                { header: 'S No', key: 'srNo', width: 8 },
                { header: 'OS Name', key: 'osName', width: 36 },
                { header: 'Build Name', key: 'buildName', width: 18 },
                { header: 'Count', key: 'count', width: 12 },
            ];
            const head = ws.getRow(1);
            head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
            ws.views = [{ state: 'frozen', ySplit: 1 }];
            finalRows.forEach(r => ws.addRow({ srNo: r.srNo, osName: r.osName, buildName: r.buildName, count: r.count }));
            const totalRow = ws.addRow({ srNo: '', osName: 'Total', buildName: '', count: totalCount });
            totalRow.font = { bold: true };
            totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };

            const buffer = await wb.xlsx.writeBuffer();
            excelFileName = `OS_Build_Report_${dateStr}.xlsx`;
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
                totalBuilds,
                totalOs,
                totalCount,
                shownRows,
            });
        }

        return {
            title,
            reportDate: dateStr,
            apiRecordCount: raw.length,
            skippedRows,
            totalBuilds,
            totalOsNames: totalOs,
            totalCount,
            rowsInEmail: generateEmailTemplate ? shownRows.length : 0,
            rows: finalRows,
            hasData: finalRows.length > 0,
            subject: `${title} - ${dateStr}`,
            htmlBody,
            excelFile,
            excelFileName,
        };
    },
});
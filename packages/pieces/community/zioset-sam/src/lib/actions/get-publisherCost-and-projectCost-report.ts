import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import ExcelJS from 'exceljs';

// ---------------------------------------------------------------------------
// API settings: the only place to change if an endpoint path changes.
// Publisher Wise: the count API gives the number that is sent as topCount
// (fallback: FALLBACK_TOP_COUNT). Project Wise has no parameters.
// ---------------------------------------------------------------------------
const PUBLISHER_ENDPOINT = '/dashboard/getPublisherWisePurchaseCost';
const PUBLISHER_COUNT_ENDPOINT = '/cio/getPublisherCount';
const FALLBACK_TOP_COUNT = 1000;
const PROJECT_ENDPOINT = '/dashboard/getProjectwiseCost';

const esc = (s: any) =>
    String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const textToHtml = (s: string) => esc(s).replace(/\r?\n/g, '<br>');
const num = (n: any) => Number(n ?? 0).toLocaleString('en-IN');
const money = (n: any) => Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const round2 = (n: number) => Math.round(n * 100) / 100;
const txt = (v: any) => (v === null || v === undefined ? '' : String(v).trim());
const dash = (s: any) => (txt(s) === '' ? '-' : txt(s));

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

const cmpText = (x: string, y: string) => {
    if (!x && !y) return 0;
    if (!x) return 1; // empty values always at the end
    if (!y) return -1;
    return x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
};

type Col = {
    key: string;
    header: string;
    width: number;
    kind: 'text' | 'int' | 'money';
    total?: boolean;     // sum in the Total row and KPI
    email?: boolean;     // shown in the email table
    optional?: boolean;  // only shown when at least one row has a value
};

type ReportCfg = {
    label: string;
    item: string;
    sheet: string;
    file: string;
    cols: Col[];
};

const REPORTS: Record<string, ReportCfg> = {
    publisher: {
        label: 'Publisher Wise Purchase Cost',
        item: 'Publisher',
        sheet: 'Publisher Wise Cost',
        file: 'Publisher_Wise',
        cols: [
            { key: 'name', header: 'Publisher Name', width: 40, kind: 'text', email: true },
            { key: 'cost', header: 'Cost', width: 14, kind: 'money', total: true, email: true },
            { key: 'users', header: 'No. of Users', width: 14, kind: 'int', total: true, email: true },
            { key: 'licences', header: 'No. of Licences', width: 16, kind: 'int', total: true, email: true },
            { key: 'free', header: 'Free Applications', width: 18, kind: 'int', total: true, email: true },
            { key: 'paid', header: 'Paid Applications', width: 18, kind: 'int', total: true, email: true },
            { key: 'installs', header: 'No. of Installs', width: 16, kind: 'int', total: true },
        ],
    },
    project: {
        label: 'Project Wise Cost',
        item: 'Project',
        sheet: 'Project Wise Cost',
        file: 'Project_Wise',
        cols: [
            { key: 'name', header: 'Project Name', width: 44, kind: 'text', email: true },
            { key: 'product', header: 'Product Name', width: 30, kind: 'text', optional: true },
            { key: 'cost', header: 'Cost', width: 14, kind: 'money', total: true, email: true },
            { key: 'count', header: 'Count', width: 12, kind: 'int', total: true, optional: true },
            { key: 'users', header: 'No. of Users', width: 14, kind: 'int', total: true, email: true },
            { key: 'licences', header: 'No. of Licences', width: 16, kind: 'int', total: true, email: true },
            { key: 'free', header: 'Free Applications', width: 18, kind: 'int', total: true, email: true },
            { key: 'paid', header: 'Paid Applications', width: 18, kind: 'int', total: true, email: true },
        ],
    },
};

type SortKey = 'licences' | 'name' | 'users' | 'cost' | 'paid';

function buildHtml(opts: {
    title: string;
    dateStr: string;
    topText: string;
    hasExcel: boolean;
    cfg: ReportCfg;
    emailCols: Col[];
    totalItems: number;
    totals: Record<string, number>;
    shownRows: Record<string, any>[];
}): string {
    const { title, dateStr, topText, hasExcel, cfg, emailCols, totalItems, totals, shownRows } = opts;

    const cell = (c: Col, r: Record<string, any>, first: boolean) => {
        const v = r[c.key];
        const text = c.kind === 'money' ? money(v) : c.kind === 'int' ? num(v) : dash(v);
        const cls = [c.kind !== 'text' ? 'num' : '', first ? 'name' : ''].filter(Boolean).join(' ');
        return `<td data-label="${esc(c.header)}" class="${cls}">${esc(text)}</td>`;
    };

    const head = emailCols.map(c => `<th class="${c.kind !== 'text' ? 'num' : ''}">${esc(c.header)}</th>`).join('');
    const body = shownRows
        .map((r, i) => `<tr class="${i % 2 ? 'alt' : ''}"><td data-label="Sr No" class="num">${r['srNo']}</td>${emailCols.map((c, ci) => cell(c, r, ci === 0)).join('')}</tr>`)
        .join('');
    const emptyRow = shownRows.length === 0
        ? `<tr><td colspan="${emailCols.length + 1}" style="padding:18px;text-align:center;color:#64748b;">No data found.</td></tr>`
        : '';

    const truncated = totalItems > shownRows.length;
    const note = truncated
        ? `Showing the first ${num(shownRows.length)} of ${num(totalItems)} rows.${hasExcel ? ' The complete list is attached as an Excel file with this email.' : ''}`
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
  .kpi .v{font-size:22px;font-weight:700;display:block;}
  .kpi .l{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;}
  .k-a .v{color:#7c3aed;} .k-b .v{color:#1d4ed8;} .k-c .v{color:#16a34a;} .k-d .v{color:#d97706;}
  table.data{width:100%;border-collapse:collapse;font-size:13px;}
  table.data th{background:#eef2ff;color:#3730a3;text-align:left;padding:10px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.4px;}
  table.data td{padding:9px 8px;border-bottom:1px solid #e2e8f0;vertical-align:middle;word-break:break-word;}
  table.data tr.alt td{background:#fafbff;}
  td.num,th.num{text-align:right;}
  td.name{font-weight:600;}
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
      <div class="tags"><span class="tag">${esc(cfg.label)}</span></div>
      <table class="kpis" role="presentation"><tr>
        <td class="kpi k-a"><span class="v">${num(totalItems)}</span><span class="l">${esc(cfg.item)}s</span></td>
        <td class="kpi k-b"><span class="v">${num(totals['licences'])}</span><span class="l">Licences</span></td>
        <td class="kpi k-c"><span class="v">${num(totals['users'])}</span><span class="l">Users</span></td>
        <td class="kpi k-d"><span class="v">${money(totals['cost'])}</span><span class="l">Total Cost</span></td>
      </tr></table>

      <table class="data">
        <thead><tr><th class="num">Sr No</th>${head}</tr></thead>
        <tbody>${body}${emptyRow}</tbody>
      </table>

      ${note ? `<p class="note">${esc(note)}</p>` : ''}
    </div>
    <div class="footer">This is an automated report. Please do not reply to this email.</div>
  </div>
</div>
</body>
</html>`;
}

export const publisherAndProjectCostReport = createAction({
    auth: zioSetAuth,
    name: 'publisher_and_project_cost_report',
    displayName: 'Publisher and Project Cost Report',
    description: 'Gets the publisher wise purchase cost or the project wise cost (users, licences, free and paid applications, cost). Optionally builds an Excel file and a responsive email body',
    aiMetadata: {
        description:
            'Reads the cost report from the ZioSet dashboard for the chosen Report Type: Publisher Wise (purchase cost per publisher, for example Microsoft Corporation) or Project Wise (cost per project, for example NETWORK). ' +
            'For Publisher Wise the number of publishers is read from the count API and used as topCount, so all publishers come in one call. ' +
            'Returns one row for each publisher or project with Cost, No. of Users, No. of Licences, Free Applications and Paid Applications ' +
            '(Publisher Wise also has No. of Installs; Project Wise also has Product Name and Count when they have values), ' +
            'plus totals: number of rows, total licences, total users, total free and paid applications and total cost. ' +
            'Users are summed over rows, so a user who is in more than one row is counted more than once. ' +
            'If there is no data, the report is empty and hasData is false. ' +
            'The action uses all data returned by the API and applies no record limit. ' +
            'Options: report type, sort column, rows in email (empty or 0 means all rows, which is the default), email top text (optional message shown at the very top of the email, above the report), Excel on/off, email template on/off. ' +
            'The optional Excel file always has all rows with a Total row. The optional HTML email body has KPI cards (always based on all rows) and a table, ' +
            'limited to the first N rows of the chosen sort order when Rows In Email is set. ' +
            'It only reads data and builds report files, so repeating the call with the same input is safe. ' +
            'Use the Get Publisher And Product List action for install counts by publisher or product.',
        idempotent: true,
    },
    props: {
        title: Property.ShortText({
            displayName: 'Report Title',
            required: false,
            defaultValue: 'Cost Report',
        }),
        emailTopText: Property.LongText({
            displayName: 'Email Top Text',
            description: 'Optional message shown at the very top of the email, above the report. Example: Dear Sir, please find the cost report below. Leave empty to show nothing.',
            required: false,
        }),
        reportType: Property.StaticDropdown({
            displayName: 'Report Type',
            required: true,
            defaultValue: 'publisher',
            options: {
                options: [
                    { label: 'Publisher Wise', value: 'publisher' },
                    { label: 'Project Wise', value: 'project' },
                ],
            },
        }),
        sortBy: Property.StaticDropdown({
            displayName: 'Sort By',
            required: false,
            defaultValue: 'licences',
            options: {
                options: [
                    { label: 'No. of Licences (high to low)', value: 'licences' },
                    { label: 'Name', value: 'name' },
                    { label: 'No. of Users (high to low)', value: 'users' },
                    { label: 'Cost (high to low)', value: 'cost' },
                    { label: 'Paid Applications (high to low)', value: 'paid' },
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
        const title = context.propsValue.title || 'Cost Report';
        const topText = String(context.propsValue.emailTopText ?? '');
        const reportType = String(context.propsValue.reportType || 'publisher');
        const sortBy = ((context.propsValue.sortBy as string) || 'licences') as SortKey;
        const emailRowLimit = Number(context.propsValue.emailRowLimit) > 0 ? Math.floor(Number(context.propsValue.emailRowLimit)) : 0; // 0 = all rows
        const generateExcel = context.propsValue.generateExcel ?? true;
        const generateEmailTemplate = context.propsValue.generateEmailTemplate ?? true;

        const cfg = REPORTS[reportType] ?? REPORTS['publisher'];
        const headers = { authorization: `Bearer ${context.auth.access_token}` };

        // Publisher Wise: the count API (a plain number, e.g. 448) becomes topCount
        let apiCount = 0;
        let endpoint = PROJECT_ENDPOINT;
        let query: Record<string, string> = {};
        if (reportType !== 'project') {
            endpoint = PUBLISHER_ENDPOINT;
            try {
                const c = await httpClient.sendRequest<any>({
                    method: HttpMethod.GET,
                    url: `${baseUrl}${PUBLISHER_COUNT_ENDPOINT}`,
                    headers,
                    timeout: 60000,
                });
                const body: any = c.body;
                const n = Number(typeof body === 'string' ? body.trim() : typeof body === 'object' && body ? (body.count ?? body.data ?? body.total) : body);
                if (Number.isFinite(n) && n > 0) apiCount = Math.floor(n);
            } catch {
                // fall back to FALLBACK_TOP_COUNT below
            }
            query = { topCount: String(apiCount > 0 ? apiCount : FALLBACK_TOP_COUNT) };
        }

        const url = `${baseUrl}${endpoint}`;
        const res = await httpClient.sendRequest<any>({
            method: HttpMethod.GET,
            url,
            headers,
            queryParams: query,
            timeout: 120000,
        });

        const raw = extractList(res.body);
        if (raw === null) {
            // Do not return an empty report silently: show what the server really sent
            throw new Error(
                `Unexpected response from ${url} (status ${res.status}). Expected a list. Response starts with: ${preview(res.body)}`
            );
        }

        const nameOf = (r: any) => txt(reportType === 'project' ? r.projectName : r.publisherName);
        const valid = raw.filter(r => r && nameOf(r) !== '');
        const skippedRows = raw.length - valid.length;

        const mapped: Record<string, any>[] = valid.map(r => ({
            name: nameOf(r),
            product: txt(r.productName),
            cost: Number(r.cost ?? 0),
            count: Number(r.count ?? 0),
            users: Number(r.noOfUser ?? 0),
            licences: Number(r.noOfLicence ?? 0),
            free: Number(r.freeApplication ?? 0),
            paid: Number(r.paidApplication ?? r.paidAppliaction ?? 0), // Publisher API spells it "paidAppliaction"
            installs: Number(r.noOfInstall ?? 0),
        }));

        mapped.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return cmpText(a['name'], b['name']);
                case 'users':
                    return b['users'] - a['users'];
                case 'cost':
                    return b['cost'] - a['cost'];
                case 'paid':
                    return b['paid'] - a['paid'];
                default:
                    return b['licences'] - a['licences'];
            }
        });

        // Sr. No. is assigned after sorting so it always runs 1..N in the shown order
        const finalRows:Record<string, any>[] = mapped.map((r, i) => ({ srNo: i + 1, ...r }));

        // Optional columns (Product Name, Count) only when at least one row has a value
        const cols = cfg.cols.filter(c => !c.optional || finalRows.some(r => (c.kind === 'text' ? r[c.key] !== '' : r[c.key] !== 0)));
        const emailCols = cols.filter(c => c.email);

        // KPI cards and the Total row always use all rows
        const totals: Record<string, number> = {};
        for (const c of cols) {
            if (c.total) {
                const s = finalRows.reduce((sum, r) => sum + Number(r[c.key] ?? 0), 0);
                totals[c.key] = c.kind === 'money' ? round2(s) : s;
            }
        }
        for (const k of ['licences', 'users', 'cost']) if (totals[k] === undefined) totals[k] = 0;
        const totalItems = finalRows.length;

        const shownRows = emailRowLimit > 0 ? finalRows.slice(0, emailRowLimit) : finalRows;
        const dateStr = reportDate();

        let excelFile: string | null = null;
        let excelFileName: string | null = null;
        if (generateExcel) {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet(cfg.sheet);
            ws.columns = [
                { header: 'Sr. No.', key: 'srNo', width: 8 },
                ...cols.map(c => ({ header: c.header, key: c.key, width: c.width })),
            ];
            const head = ws.getRow(1);
            head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
            ws.views = [{ state: 'frozen', ySplit: 1 }];
            finalRows.forEach(r => ws.addRow(r));

            const totalValues: Record<string, any> = { srNo: '', name: 'Total' };
            for (const k of Object.keys(totals)) totalValues[k] = totals[k];
            const totalRow = ws.addRow(totalValues);
            totalRow.font = { bold: true };
            totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
            cols.filter(c => c.kind === 'money').forEach(c => {
                ws.getColumn(c.key).numFmt = '#,##0.00';
            });

            const buffer = await wb.xlsx.writeBuffer();
            excelFileName = `Cost_Report_${cfg.file}_${dateStr}.xlsx`;
            excelFile = await context.files.write({
                fileName: excelFileName,
                data: Buffer.from(buffer as ArrayBuffer),
            });
        }

        let htmlBody: string | null = null;
        if (generateEmailTemplate) {
            htmlBody = buildHtml({ title, dateStr, topText, hasExcel: generateExcel, cfg, emailCols, totalItems, totals, shownRows });
        }

        return {
            title,
            reportDate: dateStr,
            reportType,
            countFromApi: apiCount,
            apiRecordCount: raw.length,
            skippedRows,
            totalItems,
            totals,
            rowsInEmail: generateEmailTemplate ? shownRows.length : 0,
            rows: finalRows,
            hasData: finalRows.length > 0,
            subject: `${title} (${cfg.label}) - ${dateStr}`,
            htmlBody,
            excelFile,
            excelFileName,
        };
    },
});
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import ExcelJS from 'exceljs';

// ---------------------------------------------------------------------------
// API settings: the only place to change when the no-pagination API is ready.
// Today (testing): the paginated API. perPage is set high so every application fits.
// Later: set ENDPOINT to the new path and make PAGING = {}.
// applicationType, licenceType and card come from the dropdowns automatically.
// ---------------------------------------------------------------------------
const ENDPOINT = '/software-risk-new/eol/applicationsByLimit';
const PAGING: Record<string, string> = { pageNo: '1', perPage: '5000' };

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

const APP_TYPE_LABEL: Record<string, string> = {
    DRIVER: 'Driver',
    MAIN_APPLICATION: 'Main Application',
    RUNTIME: 'Runtime',
    SUPPORTING_PROCESS: 'Supporting Process',
};
const LICENCE_LABEL: Record<string, string> = {
    All: 'All',
    Free: 'Free',
    OpenSource: 'Open Source',
    Commercial: 'Commercial',
};

type SortKey = 'product' | 'publisher' | 'versions' | 'count';

type Row = {
    srNo: number;
    product: string;
    publisher: string;
    softwareType: string;
    versions: number;
    count: number;
};

function buildHtml(opts: {
    title: string;
    dateStr: string;
    topText: string;
    hasExcel: boolean;
    applicationTypeLabel: string;
    licenceTypeLabel: string;
    card: string;
    totalApplications: number;
    totalVersions: number;
    totalCount: number;
    shownRows: Row[];
}): string {
    const {
        title, dateStr, topText, hasExcel, applicationTypeLabel, licenceTypeLabel, card,
        totalApplications, totalVersions, totalCount, shownRows,
    } = opts;

    const cardClass = card === 'EOL Expired' ? 'tag-red' : 'tag-amber';

    const tableRows = shownRows
        .map((r, i) => `
<tr class="${i % 2 ? 'alt' : ''}">
  <td data-label="Sr No" class="num">${r.srNo}</td>
  <td data-label="Product" class="name">${esc(r.product)}</td>
  <td data-label="Publisher">${esc(dash(r.publisher))}</td>
  <td data-label="Software Type">${esc(r.softwareType)}</td>
  <td data-label="Versions" class="num">${num(r.versions)}</td>
  <td data-label="Count" class="num">${num(r.count)}</td>
</tr>`)
        .join('');

    const emptyRow = shownRows.length === 0
        ? `<tr><td colspan="6" style="padding:18px;text-align:center;color:#64748b;">No applications found for the selected filters.</td></tr>`
        : '';

    const truncated = totalApplications > shownRows.length;
    const note = truncated
        ? `Showing the first ${num(shownRows.length)} of ${num(totalApplications)} applications.${
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
  .intro{max-width:900px;margin:0 auto 18px;padding:0 4px;font-size:15px;line-height:1.7;color:#1e293b;word-break:break-word;}
  .card{max-width:900px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,.10);}
  .header{background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#fff;padding:28px 24px;}
  .header h1{margin:0;font-size:22px;font-weight:700;}
  .header p{margin:6px 0 0;font-size:13px;opacity:.9;}
  .content{padding:22px 24px;}
  .tags{margin:0 0 16px;}
  .tag{display:inline-block;padding:4px 12px;margin:0 8px 6px 0;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:700;}
  .tag-amber{background:#fef3c7;color:#b45309;} .tag-red{background:#fee2e2;color:#b91c1c;}
  .kpis{width:100%;border-collapse:separate;border-spacing:10px 0;margin:0 -10px 20px;}
  .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 10px;text-align:center;}
  .kpi .v{font-size:24px;font-weight:700;display:block;}
  .kpi .l{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;}
  .k-app .v{color:#1d4ed8;} .k-ver .v{color:#7c3aed;} .k-cnt .v{color:#16a34a;}
  table.data{width:100%;border-collapse:collapse;font-size:14px;}
  table.data th{background:#eef2ff;color:#3730a3;text-align:left;padding:10px 12px;font-size:12px;text-transform:uppercase;letter-spacing:.4px;}
  table.data td{padding:10px 12px;border-bottom:1px solid #e2e8f0;vertical-align:middle;word-break:break-word;}
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
      <div class="tags">
        <span class="tag ${cardClass}">${esc(card)}</span>
        <span class="tag">${esc(applicationTypeLabel)}</span>
        <span class="tag">${esc(licenceTypeLabel)}</span>
      </div>
      <table class="kpis" role="presentation"><tr>
        <td class="kpi k-app"><span class="v">${num(totalApplications)}</span><span class="l">Applications</span></td>
        <td class="kpi k-ver"><span class="v">${num(totalVersions)}</span><span class="l">Versions</span></td>
        <td class="kpi k-cnt"><span class="v">${num(totalCount)}</span><span class="l">Count</span></td>
      </tr></table>

      <table class="data">
        <thead><tr>
          <th class="num">Sr No</th><th>Product</th><th>Publisher</th><th>Software Type</th><th class="num">Versions</th><th class="num">Count</th>
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

export const eolApplications = createAction({
    auth: zioSetAuth,
    name: 'eol_applications',
    displayName: 'End of Life Applications',
    description: 'Gets the EOL (end of life) applications by application type, licence type and EOL card (product, software type, versions). Optionally builds an Excel file and a responsive email body',
    aiMetadata: {
        description:
            'Reads the EOL (end of life) applications report from ZioSet for the chosen Application Type (Driver, Main Application, Runtime or Supporting Process), ' +
            'Licence Type (All, Free, Open Source or Commercial) and EOL Card (EOL Expiring or EOL Expired). ' +
            'Returns one row for each application with Product, Publisher, Software Type, Versions and Count (for example Visual Studio by Microsoft Corporation), ' +
            'plus totals: number of applications, total versions and total count. If there is no data for the selected filters, the report is empty and hasData is false. ' +
            'The action uses all data returned by the API and applies no record limit. ' +
            'Options: application type, licence type, EOL card, sort column, rows in email (empty or 0 means all rows), email top text (optional message shown at the very top of the email, above the report), Excel on/off, email template on/off. ' +
            'The optional Excel file always has all rows with a Total row (Sr. No., Product, Software Type, Versions). The optional HTML email body has KPI cards (always based on all rows) and a table, ' +
            'limited to the first N rows of the chosen sort order when Rows In Email is set. ' +
            'It only reads data and builds report files, so repeating the call with the same input is safe. ' +
            'Use the VulnerabilityApplications action for vulnerable applications and the allBlacklistApplication action for blacklisted applications.',
        idempotent: true,
    },
    props: {
        title: Property.ShortText({
            displayName: 'Report Title',
            required: false,
            defaultValue: 'EOL Applications Report',
        }),
        emailTopText: Property.LongText({
            displayName: 'Email Top Text',
            description: 'Optional message shown at the very top of the email, above the report. Example: Dear Sir, please find the EOL applications report below. Leave empty to show nothing.',
            required: false,
        }),
        applicationType: Property.StaticDropdown({
            displayName: 'Application Type',
            required: true,
            defaultValue: 'MAIN_APPLICATION',
            options: {
                options: [
                    { label: 'Main Application', value: 'MAIN_APPLICATION' },
                    { label: 'Driver', value: 'DRIVER' },
                    { label: 'Runtime', value: 'RUNTIME' },
                    { label: 'Supporting Process', value: 'SUPPORTING_PROCESS' },
                ],
            },
        }),
        licenceType: Property.StaticDropdown({
            displayName: 'Licence Type',
            required: true,
            defaultValue: 'free',
            options: {
                options: [
                    { label: 'Free', value: 'Free' },
                    { label: 'Open Source', value: 'OpenSource' },
                    { label: 'Commercial', value: 'Commercial' },
                ],
            },
        }),
        card: Property.StaticDropdown({
            displayName: 'EOL Card',
            required: true,
            defaultValue: 'EOL Expiring',
            options: {
                options: [
                    { label: 'EOL Expiring', value: 'EOL Expiring' },
                    { label: 'EOL Expired', value: 'EOL Expired' },
                ],
            },
        }),
        sortBy: Property.StaticDropdown({
            displayName: 'Sort By',
            required: false,
            defaultValue: 'count',
            options: {
                options: [
                    { label: 'Count (high to low)', value: 'count' },
                    { label: 'Versions (high to low)', value: 'versions' },
                    { label: 'Product', value: 'product' },
                    { label: 'Publisher', value: 'publisher' },
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
            description: 'Turn ON to create the Excel file (Sr. No., Product, Software Type, Versions)',
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
        const title = context.propsValue.title || 'EOL Applications Report';
        const topText = String(context.propsValue.emailTopText ?? '');
        const applicationType = String(context.propsValue.applicationType || 'MAIN_APPLICATION');
        const licenceType = String(context.propsValue.licenceType || 'All');
        const card = String(context.propsValue.card || 'EOL Expiring');
        const sortBy = ((context.propsValue.sortBy as string) || 'count') as SortKey;
        const emailRowLimit = Number(context.propsValue.emailRowLimit) > 0 ? Math.floor(Number(context.propsValue.emailRowLimit)) : 0; // 0 = all rows
        const generateExcel = context.propsValue.generateExcel ?? true;
        const generateEmailTemplate = context.propsValue.generateEmailTemplate ?? true;

        const applicationTypeLabel = APP_TYPE_LABEL[applicationType] ?? applicationType;
        const licenceTypeLabel = LICENCE_LABEL[licenceType] ?? licenceType;

        const url = `${baseUrl}${ENDPOINT}`;
        const res = await httpClient.sendRequest<any>({
            method: HttpMethod.GET,
            url,
            headers: { authorization: `Bearer ${context.auth.access_token}` },
            queryParams: { ...PAGING, applicationType, licenceType, card },
            timeout: 120000,
        });

        const raw = extractList(res.body);
        if (raw === null) {
            // Do not return an empty report silently: show what the server really sent
            throw new Error(
                `Unexpected response from ${url} (status ${res.status}). Expected a list of applications. Response starts with: ${preview(res.body)}`
            );
        }

        const valid = raw.filter(r => r && String(r.application ?? '').trim() !== '');
        const skippedRows = raw.length - valid.length;

        const rows = valid
            .map(r => ({
                product: String(r.application).trim(),
                publisher: String(r.publisher ?? '').trim(),
                softwareType: applicationTypeLabel,
                versions: Number(r.version ?? 0),
                count: Number(r.count ?? 0),
            }))
            .sort((a, b) => {
                if (sortBy === 'count') return b.count - a.count;
                if (sortBy === 'versions') return b.versions - a.versions;
                const x = sortBy === 'publisher' ? a.publisher : a.product;
                const y = sortBy === 'publisher' ? b.publisher : b.product;
                // Empty values always go to the end
                if (!x && !y) return 0;
                if (!x) return 1;
                if (!y) return -1;
                return x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
            });

        // Sr. No. is assigned after sorting so it always runs 1..N in the shown order
        const finalRows: Row[] = rows.map((r, i) => ({ srNo: i + 1, ...r }));

        // KPI cards and the Total row always use all rows
        const totalApplications = finalRows.length;
        const totalVersions = finalRows.reduce((s, r) => s + r.versions, 0);
        const totalCount = finalRows.reduce((s, r) => s + r.count, 0);

        const shownRows = emailRowLimit > 0 ? finalRows.slice(0, emailRowLimit) : finalRows;
        const dateStr = reportDate();

        let excelFile: string | null = null;
        let excelFileName: string | null = null;
        if (generateExcel) {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('EOL Applications');
            ws.columns = [
                { header: 'Sr. No.', key: 'srNo', width: 8 },
                { header: 'Product', key: 'product', width: 40 },
                { header: 'Software Type', key: 'softwareType', width: 22 },
                { header: 'Versions', key: 'versions', width: 12 },
            ];
            const head = ws.getRow(1);
            head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
            ws.views = [{ state: 'frozen', ySplit: 1 }];
            finalRows.forEach(r => ws.addRow(r));
            const totalRow = ws.addRow({ srNo: '', product: 'Total', softwareType: '', versions: totalVersions });
            totalRow.font = { bold: true };
            totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };

            const buffer = await wb.xlsx.writeBuffer();
            excelFileName = `EOL_Applications_${applicationType}_${licenceType}_${card.replace(/\s+/g, '_')}_${dateStr}.xlsx`;
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
                applicationTypeLabel,
                licenceTypeLabel,
                card,
                totalApplications,
                totalVersions,
                totalCount,
                shownRows,
            });
        }

        return {
            title,
            reportDate: dateStr,
            applicationType,
            licenceType,
            card,
            apiRecordCount: raw.length,
            skippedRows,
            totalApplications,
            totalVersions,
            totalCount,
            rowsInEmail: generateEmailTemplate ? shownRows.length : 0,
            rows: finalRows,
            hasData: finalRows.length > 0,
            subject: `${title} (${card} - ${applicationTypeLabel} - ${licenceTypeLabel}) - ${dateStr}`,
            htmlBody,
            excelFileName,
            excelFile,
        };
    },
});
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import ExcelJS from 'exceljs';

// ---------------------------------------------------------------------------
// API settings: the only place to change when the no-pagination API is ready.
// Today (testing): the paginated API.
// Later: set ENDPOINT to the new path and QUERY to {} (the action does not
// apply any limit of its own, it uses whatever the API returns).
// ---------------------------------------------------------------------------
const ENDPOINT = '/report/getStockStatusByLimit';
const QUERY: Record<string, string> = { pageNo: '1', perPage: '27' };

const esc = (s: any) =>
    String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const num = (n: any) => Number(n ?? 0).toLocaleString('en-IN');

// Report date in IST, so the value is correct even if the server runs in UTC
const reportDate = () =>
    new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }).replace(/\//g, '-');

type SortKey = 'item' | 'purchaseCount' | 'installCount' | 'availableCount';

type Row = {
    id: number;
    item: string;
    purchaseCount: number;
    installCount: number;
    availableCount: number;
};

// Installed % = installed / purchased (capped at 100). Returns null when nothing was purchased.
const installedPct = (r: { installCount: number; purchaseCount: number }): number | null =>
    r.purchaseCount > 0 ? Math.min(100, Math.round((r.installCount / r.purchaseCount) * 100)) : null;

function buildHtml(opts: {
    title: string;
    dateStr: string;
    hasExcel: boolean;
    totals: { purchaseCount: number; installCount: number; availableCount: number };
    totalRows: number;
    shownRows: Row[];
}): string {
    const { title, dateStr, hasExcel, totals, totalRows, shownRows } = opts;

    const tableRows = shownRows
        .map((r, i) => {
            const p = installedPct(r);
            const bar =
                p === null
                    ? '<span class="pct">N/A</span>'
                    : `<div class="track"><div class="fill" style="width:${p}%"></div></div><span class="pct">${p}%</span>`;
            return `
<tr class="${i % 2 ? 'alt' : ''}">
  <td data-label="ID" class="num">${r.id}</td>
  <td data-label="Item" class="name">${esc(r.item)}</td>
  <td data-label="Purchase" class="num">${num(r.purchaseCount)}</td>
  <td data-label="Installed" class="num">${num(r.installCount)}</td>
  <td data-label="Available" class="num">${num(r.availableCount)}</td>
  <td data-label="Installed %">${bar}</td>
</tr>`;
        })
        .join('');

    const truncated = totalRows > shownRows.length;
    const note = truncated
        ? `Showing the first ${num(shownRows.length)} of ${num(totalRows)} items.${
              hasExcel ? ' The complete list is attached as an Excel file with this email.' : ''
          }`
        : hasExcel
        ? 'The detailed stock status data is attached as an Excel file with this email.'
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<style>
  body{margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;}
  .wrap{width:100%;padding:24px 12px;box-sizing:border-box;}
  .card{max-width:860px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,.10);}
  .header{background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#fff;padding:28px 24px;}
  .header h1{margin:0;font-size:22px;font-weight:700;}
  .header p{margin:6px 0 0;font-size:13px;opacity:.9;}
  .content{padding:22px 24px;}
  .kpis{width:100%;border-collapse:separate;border-spacing:10px 0;margin:0 -10px 20px;}
  .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 10px;text-align:center;}
  .kpi .v{font-size:24px;font-weight:700;display:block;}
  .kpi .l{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;}
  .k-item .v{color:#7c3aed;} .k-pur .v{color:#1d4ed8;} .k-inst .v{color:#ea580c;} .k-avail .v{color:#16a34a;}
  table.data{width:100%;border-collapse:collapse;font-size:14px;}
  table.data th{background:#eef2ff;color:#3730a3;text-align:left;padding:10px 12px;font-size:12px;text-transform:uppercase;letter-spacing:.4px;}
  table.data td{padding:10px 12px;border-bottom:1px solid #e2e8f0;vertical-align:middle;word-break:break-word;}
  table.data tr.alt td{background:#fafbff;}
  td.num,th.num{text-align:right;}
  td.name{font-weight:600;}
  .track{display:inline-block;width:90px;height:8px;background:#e2e8f0;border-radius:6px;overflow:hidden;vertical-align:middle;}
  .fill{height:8px;background:linear-gradient(90deg,#f59e0b,#ea580c);}
  .pct{font-size:12px;color:#475569;margin-left:6px;}
  .note{margin-top:18px;font-size:13px;color:#475569;line-height:1.5;}
  .footer{background:#f1f5f9;text-align:center;padding:16px;font-size:12px;color:#94a3b8;}

  @media only screen and (max-width:600px){
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
  <div class="card">
    <div class="header">
      <h1>${esc(title)}</h1>
      <p>As on ${esc(dateStr)}</p>
    </div>
    <div class="content">
      <table class="kpis" role="presentation"><tr>
        <td class="kpi k-item"><span class="v">${num(totalRows)}</span><span class="l">Items</span></td>
        <td class="kpi k-pur"><span class="v">${num(totals.purchaseCount)}</span><span class="l">Purchased</span></td>
        <td class="kpi k-inst"><span class="v">${num(totals.installCount)}</span><span class="l">Installed</span></td>
        <td class="kpi k-avail"><span class="v">${num(totals.availableCount)}</span><span class="l">Available</span></td>
      </tr></table>

      <table class="data">
        <thead><tr>
          <th class="num">ID</th><th>Item</th><th class="num">Purchase</th><th class="num">Installed</th>
          <th class="num">Available</th><th>Installed %</th>
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

export const stockStatusReport = createAction({
    auth: zioSetAuth,
    name: 'stock_status_report',
    displayName: 'Stock Status Report',
    description: 'Gets the stock status (purchase, install and available counts per item). Optionally builds an Excel file and a responsive email body',
    aiMetadata: {
        description:
            'Reads the Stock Status report from ZioSet and returns, for each item (software or licence such as Postman or GitHub Desktop): ' +
            'Purchase Count, Install Count and Available Count, plus totals. ' +
            'The action uses all data returned by the API and applies no record limit. ' +
            'Options: sort column, rows in email (empty or 0 means all rows), Excel on/off, email template on/off. ' +
            'The optional Excel file always has all rows with a Total row. The optional HTML email body has KPI cards (always based on all rows) ' +
            'and a table with an installed-percentage bar for each item, limited to the first N rows of the chosen sort order when Rows In Email is set. ' +
            'It only reads data and builds report files, so repeating the call with the same input is safe. ' +
            'Use the Compliance Report for compliant and non-compliant counts per product, and the "Wise Asset Summary" actions for hardware counts.',
        idempotent: true,
    },
    props: {
        title: Property.ShortText({
            displayName: 'Report Title',
            required: false,
            defaultValue: 'Stock Status Report',
        }),
        sortBy: Property.StaticDropdown({
            displayName: 'Sort By',
            required: false,
            defaultValue: 'item',
            options: {
                options: [
                    { label: 'Item', value: 'item' },
                    { label: 'Purchase Count (high to low)', value: 'purchaseCount' },
                    { label: 'Install Count (high to low)', value: 'installCount' },
                    { label: 'Available Count (high to low)', value: 'availableCount' },
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
            description: 'Turn ON to create the Excel file (ID, Item, Purchase Count, Install Count, Available Count)',
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
        const baseUrl = context.auth.props.baseUrl;
        const title = context.propsValue.title || 'Stock Status Report';
        const sortBy = ((context.propsValue.sortBy as string) || 'item') as SortKey;
        const emailRowLimit = Number(context.propsValue.emailRowLimit) > 0 ? Math.floor(Number(context.propsValue.emailRowLimit)) : 0; // 0 = all rows
        const generateExcel = context.propsValue.generateExcel ?? true;
        const generateEmailTemplate = context.propsValue.generateEmailTemplate ?? true;

        const res = await httpClient.sendRequest<any>({
            method: HttpMethod.GET,
            url: `${baseUrl}${ENDPOINT}`,
            headers: { authorization: `Bearer ${context.auth.access_token}` },
            queryParams: QUERY,
            timeout: 120000,
        });

        // The API returns a plain array; also accept a wrapped list just in case
        const body: any = res.body;
        const raw: any[] = Array.isArray(body)
            ? body
            : Array.isArray(body?.data)
            ? body.data
            : Array.isArray(body?.content)
            ? body.content
            : [];

        const rows = raw
            .filter(r => r && String(r.item ?? '').trim() !== '')
            .map(r => ({
                item: String(r.item).trim(),
                purchaseCount: Number(r.purchasecount ?? 0),
                installCount: Number(r.installcount ?? 0),
                availableCount: Number(r.availableCount ?? 0),
            }))
            .sort((a, b) => (sortBy === 'item' ? a.item.localeCompare(b.item) : b[sortBy] - a[sortBy]));

        // ID is assigned after sorting so it always runs 1..N in the shown order
        const finalRows: Row[] = rows.map((r, i) => ({ id: i + 1, ...r }));

        // KPI cards and the Total row always use all rows
        const totals = finalRows.reduce(
            (s, r) => ({
                purchaseCount: s.purchaseCount + r.purchaseCount,
                installCount: s.installCount + r.installCount,
                availableCount: s.availableCount + r.availableCount,
            }),
            { purchaseCount: 0, installCount: 0, availableCount: 0 }
        );

        const shownRows = emailRowLimit > 0 ? finalRows.slice(0, emailRowLimit) : finalRows;
        const dateStr = reportDate();

        let excelFile: string | null = null;
        let excelFileName: string | null = null;
        if (generateExcel) {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Stock Status');
            ws.columns = [
                { header: 'ID', key: 'id', width: 8 },
                { header: 'Item', key: 'item', width: 40 },
                { header: 'Purchase Count', key: 'purchaseCount', width: 18 },
                { header: 'Install Count', key: 'installCount', width: 16 },
                { header: 'Available Count', key: 'availableCount', width: 18 },
            ];
            const head = ws.getRow(1);
            head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
            ws.views = [{ state: 'frozen', ySplit: 1 }];
            finalRows.forEach(r => ws.addRow(r));
            const totalRow = ws.addRow({ id: '', item: 'Total', ...totals });
            totalRow.font = { bold: true };
            totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };

            const buffer = await wb.xlsx.writeBuffer();
            excelFileName = `Stock_Status_Report_${dateStr}.xlsx`;
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
                hasExcel: generateExcel,
                totals,
                totalRows: finalRows.length,
                shownRows,
            });
        }

        return {
            title,
            reportDate: dateStr,
            totalItems: finalRows.length,
            rowsInEmail: generateEmailTemplate ? shownRows.length : 0,
            totals,
            rows: finalRows,
            hasData: finalRows.length > 0,
            subject: `${title} - ${dateStr}`,
            htmlBody,
            excelFileName,
            excelFile,
        };
    },
});
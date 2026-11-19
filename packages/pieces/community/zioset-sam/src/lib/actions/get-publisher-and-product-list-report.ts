import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import ExcelJS from 'exceljs';

// ---------------------------------------------------------------------------
// API settings: the only place to change if an endpoint path changes.
// Both APIs return the full list (no pagination), so there is no paging query.
// ---------------------------------------------------------------------------
const REPORTS: Record<string, { endpoint: string; label: string; item: string; sheet: string; file: string; hasAction: boolean }> = {
    publisher: {
        endpoint: '/dashboard/getPublisherWiseInstallLicenceList',
        label: 'Publisher Wise',
        item: 'Publisher',
        sheet: 'Publisher Wise Install',
        file: 'Publisher_Wise',
        hasAction: true, // the Publisher Excel format has an Action column
    },
    product: {
        endpoint: '/dashboard/getProductWiseInstallList',
        label: 'Product Wise',
        item: 'Product',
        sheet: 'Product Wise Install',
        file: 'Product_Wise',
        hasAction: false, // the Product Excel format has no Action column
    },
};

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

type SortKey = 'count' | 'name';

type Row = {
    srNo: number;
    name: string;
    count: number;
    share: number;
    action: string;
    remark: string;
    totalCount: number;
    assignedCount: number;
    activeCount: number;
    inactiveCount: number;
    diffCount: number;
    installCount: number;
    cost: number;
};

function buildHtml(opts: {
    title: string;
    dateStr: string;
    topText: string;
    hasExcel: boolean;
    reportLabel: string;
    item: string;
    totalItems: number;
    totalCount: number;
    topName: string;
    shownRows: Row[];
}): string {
    const { title, dateStr, topText, hasExcel, reportLabel, item, totalItems, totalCount, topName, shownRows } = opts;

    const tableRows = shownRows
        .map((r, i) => `
<tr class="${i % 2 ? 'alt' : ''}">
  <td data-label="S No" class="num">${r.srNo}</td>
  <td data-label="Name" class="name">${esc(r.name)}</td>
  <td data-label="Count" class="num">${num(r.count)}</td>
  <td data-label="Share">
    <div class="track"><div class="fill" style="width:${Math.min(100, r.share)}%"></div></div>
    <span class="pct">${r.share}%</span>
  </td>
</tr>`)
        .join('');

    const emptyRow = shownRows.length === 0
        ? `<tr><td colspan="4" style="padding:18px;text-align:center;color:#64748b;">No data found.</td></tr>`
        : '';

    const truncated = totalItems > shownRows.length;
    const note = truncated
        ? `Showing the first ${num(shownRows.length)} of ${num(totalItems)} rows.${
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
  .tags{margin:0 0 16px;}
  .tag{display:inline-block;padding:4px 12px;margin:0 8px 6px 0;border-radius:999px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:700;}
  .kpis{width:100%;border-collapse:separate;border-spacing:10px 0;margin:0 -10px 20px;}
  .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 10px;text-align:center;}
  .kpi .v{font-size:24px;font-weight:700;display:block;word-break:break-word;}
  .kpi .v.small{font-size:16px;line-height:1.5;}
  .kpi .l{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;}
  .k-cnt .v{color:#1d4ed8;} .k-item .v{color:#16a34a;} .k-top .v{color:#7c3aed;}
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
      <div class="tags"><span class="tag">${esc(reportLabel)}</span></div>
      <table class="kpis" role="presentation"><tr>
        <td class="kpi k-cnt"><span class="v">${num(totalCount)}</span><span class="l">Total Count</span></td>
        <td class="kpi k-item"><span class="v">${num(totalItems)}</span><span class="l">${esc(item)}s</span></td>
        <td class="kpi k-top"><span class="v small">${esc(dash(topName))}</span><span class="l">Highest</span></td>
      </tr></table>

      <table class="data">
        <thead><tr>
          <th class="num">S No</th><th>${esc(item)}</th><th class="num">Count</th><th>Share</th>
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

export const getPublisherAndProductList = createAction({
    auth: zioSetAuth,
    name: 'get_publisher_and_product_list',
    displayName: 'Get Publisher and Product List',
    description: 'Gets the publisher wise or product wise install count from the ZioSet dashboard (name and count). Optionally builds an Excel file and a responsive email body',
    aiMetadata: {
        description:
            'Reads the install count list from the ZioSet dashboard for the chosen Report Type: Publisher Wise (for example Microsoft Corporation, Apple Inc.) or Product Wise (for example Microsoft Edge). ' +
            'Returns one row for each publisher or product with its Count (the number of installs), the share of the total in percent, ' +
            'plus totals: total count, number of rows and the highest item. ' +
            'Each row also carries the other API fields (remark, total count, assigned, active, inactive, difference, install count and cost). ' +
            'If there is no data, the report is empty and hasData is false. ' +
            'The action uses all data returned by the API and applies no record limit. ' +
            'Options: report type, sort column, rows in email (empty or 0 means all rows), email top text (optional message shown at the very top of the email, above the report), ' +
            'include all API fields in Excel on/off, Excel on/off, email template on/off. ' +
            'The optional Excel file always has all rows with a Total row for Count (S No., Name, Count, Share, plus Action for Publisher Wise). ' +
            'The optional HTML email body has KPI cards (always based on all rows) and a table with a share bar, ' +
            'limited to the first N rows of the chosen sort order when Rows In Email is set. ' +
            'It only reads data and builds report files, so repeating the call with the same input is safe. ' +
            'Use the ReconsilationReport action for product-wise record counts with publisher and the CategoryWiseInstallReport action for the category list.',
        idempotent: true,
    },
    props: {
        title: Property.ShortText({
            displayName: 'Report Title',
            required: false,
            defaultValue: 'Install Publisher or Product Report',
        }),
        emailTopText: Property.LongText({
            displayName: 'Email Top Text',
            description: 'Optional message shown at the very top of the email, above the report. Example: Dear Sir, please find the install report below. Leave empty to show nothing.',
            required: false,
        }),
        reportType: Property.StaticDropdown({
            displayName: 'Report Type',
            required: true,
            defaultValue: 'publisher',
            options: {
                options: [
                    { label: 'Publisher Wise', value: 'publisher' },
                    { label: 'Product Wise', value: 'product' },
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
                    { label: 'Name', value: 'name' },
                ],
            },
        }),
        emailRowLimit: Property.Number({
            displayName: 'Rows In Email',
            description: 'How many rows to show in the email body. Leave empty or 0 to show all rows. The Excel file always has all rows.',
            required: false,
        }),
        includeAllFields: Property.Checkbox({
            displayName: 'Include All API Fields In Excel',
            description: 'Turn ON to also add Remark, Total Count, Assigned, Active, Inactive, Difference, Install Count and Cost columns to the Excel file',
            required: false,
            defaultValue: false,
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
        const title = context.propsValue.title || 'Install Report';
        const topText = String(context.propsValue.emailTopText ?? '');
        const reportType = String(context.propsValue.reportType || 'publisher');
        const sortBy = ((context.propsValue.sortBy as string) || 'count') as SortKey;
        const emailRowLimit = Number(context.propsValue.emailRowLimit) > 0 ? Math.floor(Number(context.propsValue.emailRowLimit)) : 0; // 0 = all rows
        const includeAllFields = context.propsValue.includeAllFields ?? false;
        const generateExcel = context.propsValue.generateExcel ?? true;
        const generateEmailTemplate = context.propsValue.generateEmailTemplate ?? true;

        const cfg = REPORTS[reportType] ?? REPORTS['publisher'];

        const url = `${baseUrl}${cfg.endpoint}`;
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

        const valid = raw.filter(r => r && String(r.name ?? '').trim() !== '');
        const skippedRows = raw.length - valid.length;

        const mapped = valid.map(r => {
            const count = Number(r.count ?? 0);
            return {
                name: String(r.name).trim(),
                count,
                action: count > 0 ? 'View Systems' : '-',
                remark: String(r.remark ?? '').trim(),
                totalCount: Number(r.totalCount ?? 0),
                assignedCount: Number(r.assinegCount ?? 0), // spelled "assinegCount" by the API
                activeCount: Number(r.activeCount ?? 0),
                inactiveCount: Number(r.inactiveCount ?? 0),
                diffCount: Number(r.diffCount ?? 0),
                installCount: Number(r.installCount ?? 0),
                cost: Number(r.cost ?? 0),
            };
        });

        mapped.sort((a, b) => {
            if (sortBy === 'name') {
                if (!a.name && !b.name) return 0;
                if (!a.name) return 1;
                if (!b.name) return -1;
                return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
            }
            return b.count - a.count;
        });

        // KPI cards and the Total row always use all rows
        const totalItems = mapped.length;
        const totalCount = mapped.reduce((s, r) => s + r.count, 0);
        const share = (c: number) => (totalCount > 0 ? Math.round((c / totalCount) * 1000) / 10 : 0);

        // S No. is assigned after sorting so it always runs 1..N in the shown order
        const finalRows: Row[] = mapped.map((r, i) => ({ srNo: i + 1, share: share(r.count), ...r }));

        const topRow = finalRows.reduce<Row | null>((best, r) => (!best || r.count > best.count ? r : best), null);
        const topName = topRow ? topRow.name : '';

        const shownRows = emailRowLimit > 0 ? finalRows.slice(0, emailRowLimit) : finalRows;
        const dateStr = reportDate();

        let excelFile: string | null = null;
        let excelFileName: string | null = null;
        if (generateExcel) {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet(cfg.sheet);
            const columns: Partial<ExcelJS.Column>[] = [
                { header: 'S No.', key: 'srNo', width: 8 },
                { header: 'Name', key: 'name', width: 44 },
                { header: 'Count', key: 'count', width: 14 },
            ];
            if (cfg.hasAction) columns.push({ header: 'Action', key: 'action', width: 16 });
            columns.push({ header: 'Share (%)', key: 'share', width: 12 });
            if (includeAllFields) {
                columns.push(
                    { header: 'Remark', key: 'remark', width: 30 },
                    { header: 'Total Count', key: 'totalCount', width: 14 },
                    { header: 'Assigned Count', key: 'assignedCount', width: 16 },
                    { header: 'Active Count', key: 'activeCount', width: 14 },
                    { header: 'Inactive Count', key: 'inactiveCount', width: 16 },
                    { header: 'Difference Count', key: 'diffCount', width: 18 },
                    { header: 'Install Count', key: 'installCount', width: 14 },
                    { header: 'Cost', key: 'cost', width: 14 },
                );
            }
            ws.columns = columns;
            const head = ws.getRow(1);
            head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
            ws.views = [{ state: 'frozen', ySplit: 1 }];
            finalRows.forEach(r => ws.addRow(r));
            const totalRow = ws.addRow({ srNo: '', name: 'Total', count: totalCount, share: totalCount > 0 ? 100 : 0 });
            totalRow.font = { bold: true };
            totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };

            const buffer = await wb.xlsx.writeBuffer();
            excelFileName = `Install_Report_${cfg.file}_${dateStr}.xlsx`;
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
                reportLabel: cfg.label,
                item: cfg.item,
                totalItems,
                totalCount,
                topName,
                shownRows,
            });
        }

        return {
            title,
            reportDate: dateStr,
            reportType,
            apiRecordCount: raw.length,
            skippedRows,
            totalItems,
            totalCount,
            topName,
            rowsInEmail: generateEmailTemplate ? shownRows.length : 0,
            rows: finalRows,
            hasData: finalRows.length > 0,
            subject: `${title} (${cfg.label}) - ${dateStr}`,
            htmlBody,
            excelFileName,
            excelFile,
        };
    },
});
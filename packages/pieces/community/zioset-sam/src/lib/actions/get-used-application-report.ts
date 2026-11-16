import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import ExcelJS from 'exceljs';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

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

// ISO date -> "dd-mm-yyyy hh:mm:ss" in IST (fast, no Intl, because it runs for every row)
const fmtDateTime = (v: any): string => {
    if (!v) return '';
    const ms = Date.parse(String(v));
    if (Number.isNaN(ms)) return '';
    const iso = new Date(ms + 330 * 60 * 1000).toISOString();
    return `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)} ${iso.slice(11, 19)}`;
};

const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
};

// Streaming worksheets have commit(); some ExcelJS typings do not list it, so call it through this helper
const commitSheet = (sheet: ExcelJS.Worksheet) => (sheet as any).commit();

const ROWS_PER_SHEET = 1_000_000; // Excel limit is 1,048,576 rows per sheet

const HEADERS = [
    'Sr No',
    'Computer Name',
    'Employee Name',
    'Project Name',
    'Serial No',
    'Model',
    'Make',
    'Product Name',
    'Product Alias',
    'Associate Name',
    'System Ip',
    'Last Running Date',
];

const COLUMN_WIDTHS = [9, 22, 28, 26, 18, 22, 14, 30, 30, 28, 26, 22];

type TopProduct = { name: string; count: number };

function buildHtml(opts: {
    title: string;
    dateStr: string;
    hasExcel: boolean;
    truncated: boolean;
    maxRecords: number;
    totalRecords: number;
    totalComputers: number;
    totalProducts: number;
    totalPublishers: number;
    sheetCount: number;
    fileSize: string | null;
    topProducts: TopProduct[];
}): string {
    const o = opts;
    const share = (c: number) => (o.totalRecords > 0 ? Math.round((c / o.totalRecords) * 1000) / 10 : 0);

    const tableRows = o.topProducts
        .map((p, i) => {
            const s = share(p.count);
            return `
<tr class="${i % 2 ? 'alt' : ''}">
  <td data-label="Product" class="name">${esc(p.name)}</td>
  <td data-label="Records" class="num">${num(p.count)}</td>
  <td data-label="Share">
    <div class="track"><div class="fill" style="width:${Math.min(100, s)}%"></div></div>
    <span class="pct">${s}%</span>
  </td>
</tr>`;
        })
        .join('');

    const notes: string[] = [];
    if (o.truncated) {
        notes.push(`This report includes the first ${num(o.maxRecords)} records only (the Max Records limit was reached).`);
    }
    if (o.hasExcel) {
        notes.push(
            `The full data is attached as an Excel file${o.fileSize ? ` (${o.fileSize})` : ''}` +
                `${o.sheetCount > 1 ? `, split over ${o.sheetCount} sheets of up to 10 lakh rows each` : ''}. It is not shown in this email because of its size.`
        );
    } else {
        notes.push('The Excel file was not generated for this run.');
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(o.title)}</title>
<style>
  body{margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;}
  .wrap{width:100%;padding:24px 12px;box-sizing:border-box;}
  .card{max-width:760px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,.10);}
  .header{background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#fff;padding:28px 24px;}
  .header h1{margin:0;font-size:22px;font-weight:700;}
  .header p{margin:6px 0 0;font-size:13px;opacity:.9;}
  .content{padding:22px 24px;}
  .kpis{width:100%;border-collapse:separate;border-spacing:10px 0;margin:0 -10px 20px;}
  .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 10px;text-align:center;}
  .kpi .v{font-size:22px;font-weight:700;display:block;}
  .kpi .l{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;}
  .k-rec .v{color:#1d4ed8;} .k-comp .v{color:#7c3aed;} .k-prod .v{color:#16a34a;} .k-pub .v{color:#ea580c;}
  .sub{font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.4px;margin:0 0 8px;}
  table.data{width:100%;border-collapse:collapse;font-size:14px;}
  table.data th{background:#eef2ff;color:#3730a3;text-align:left;padding:10px 12px;font-size:12px;text-transform:uppercase;letter-spacing:.4px;}
  table.data td{padding:10px 12px;border-bottom:1px solid #e2e8f0;vertical-align:middle;word-break:break-word;}
  table.data tr.alt td{background:#fafbff;}
  td.num,th.num{text-align:right;}
  td.name{font-weight:600;}
  .track{display:inline-block;width:110px;height:8px;background:#e2e8f0;border-radius:6px;overflow:hidden;vertical-align:middle;}
  .fill{height:8px;background:linear-gradient(90deg,#6366f1,#4f46e5);}
  .pct{font-size:12px;color:#475569;margin-left:6px;}
  .note{margin-top:14px;font-size:13px;color:#475569;line-height:1.5;}
  .footer{background:#f1f5f9;text-align:center;padding:16px;font-size:12px;color:#94a3b8;}

  @media only screen and (max-width:600px){
    .header{padding:22px 16px;} .content{padding:16px;}
    .kpis,.kpis tbody,.kpis tr,.kpis td{display:block;width:100%;}
    .kpis{border-spacing:0;margin:0 0 12px;}
    .kpis td{margin-bottom:10px;}
    table.data thead{display:none;}
    table.data,table.data tbody,table.data tr,table.data td{display:block;width:100%;box-sizing:border-box;}
    table.data tr{margin-bottom:12px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;background:#fff;}
    table.data tr.alt td{background:#fff;}
    table.data td{display:flex;justify-content:space-between;align-items:center;text-align:right;border-bottom:1px solid #f1f5f9;padding:9px 12px;}
    table.data td:last-child{border-bottom:none;}
    table.data td:before{content:attr(data-label);font-weight:600;color:#64748b;text-align:left;font-size:12px;text-transform:uppercase;margin-right:12px;}
    td.name{background:#eef2ff;color:#3730a3;font-size:15px;justify-content:flex-start;}
    td.name:before{content:'';margin:0;}
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="header">
      <h1>${esc(o.title)}</h1>
      <p>As on ${esc(o.dateStr)}</p>
    </div>
    <div class="content">
      <table class="kpis" role="presentation"><tr>
        <td class="kpi k-rec"><span class="v">${num(o.totalRecords)}</span><span class="l">Records</span></td>
        <td class="kpi k-comp"><span class="v">${num(o.totalComputers)}</span><span class="l">Computers</span></td>
        <td class="kpi k-prod"><span class="v">${num(o.totalProducts)}</span><span class="l">Products</span></td>
        <td class="kpi k-pub"><span class="v">${num(o.totalPublishers)}</span><span class="l">Publishers</span></td>
      </tr></table>

      ${
          o.topProducts.length
              ? `<p class="sub">Top ${o.topProducts.length} products by records</p>
      <table class="data">
        <thead><tr><th>Product</th><th class="num">Records</th><th>Share</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>`
              : ''
      }

      ${notes.map(n => `<p class="note">${esc(n)}</p>`).join('')}
    </div>
    <div class="footer">This is an automated report. Please do not reply to this email.</div>
  </div>
</div>
</body>
</html>`;
}

export const usedApplicationReport = createAction({
    auth: zioSetAuth,
    name: 'used_application_report',
    displayName: 'Used Application Report',
    description: 'Gets the used application report (which application runs on which computer). Optionally builds an Excel file and a responsive email summary',
    aiMetadata: {
        description:
            'Reads the Used Application report from ZioSet: one record for each application found running on a computer, with Computer Name, Employee Name, ' +
            'Project Name, Serial No, Model, Make, Product Name, Product Alias, Associate (publisher) Name, System IP and Last Running Date. ' +
            'The report can have millions of records, so data is fetched page by page up to the Max Records prop (default 100000) and written straight to an Excel file ' +
            '(a new sheet is started after every 10 lakh rows). ' +
            'The action returns the Excel file reference and summary counts (records, computers, products, publishers, top products), never the rows. ' +
            'The optional HTML email body has only the summary and top products. ' +
            'Options: max records, page size, top N products in the email, Excel on/off, email template on/off. ' +
            'It only reads data and builds report files, so repeating the call with the same input is safe. ' +
            'Use the "Wise Asset Summary" actions for hardware counts and Install Licence Stock Report for installed licences.',
        idempotent: true,
    },
    props: {
        title: Property.ShortText({
            displayName: 'Report Title',
            required: false,
            defaultValue: 'Used Application Report',
        }),
        maxRecords: Property.Number({
            displayName: 'Max Records',
            description: 'Maximum number of records to include. The full report can have millions of rows, so increase this carefully.',
            required: false,
            defaultValue: 100000,
        }),
        pageSize: Property.Number({
            displayName: 'Page Size',
            description: 'How many records to request from the API per call (perPage). Smaller is safer for memory.',
            required: false,
            defaultValue: 10000,
        }),
        topN: Property.Number({
            displayName: 'Top Products In Email',
            description: 'How many top products to show in the email summary',
            required: false,
            defaultValue: 10,
        }),
        generateExcel: Property.Checkbox({
            displayName: 'Generate Excel',
            description: 'Turn ON to create the Excel file (Sr No, Computer Name, Employee Name, Project Name, Serial No, Model, Make, Product Name, Product Alias, Associate Name, System Ip, Last Running Date)',
            required: false,
            defaultValue: true,
        }),
        generateEmailTemplate: Property.Checkbox({
            displayName: 'Generate Email Template',
            description: 'Turn ON to create the responsive HTML email body (summary only, no data rows)',
            required: false,
            defaultValue: true,
        }),
    },

    async run(context) {
        const baseUrl = context.auth.props.baseUrl;
        const title = context.propsValue.title || 'Used Application Report';
        const maxRecords = Number(context.propsValue.maxRecords) > 0 ? Math.floor(Number(context.propsValue.maxRecords)) : 100000;
        const pageSize = Number(context.propsValue.pageSize) > 0 ? Math.floor(Number(context.propsValue.pageSize)) : 10000;
        const topN = Number(context.propsValue.topN) > 0 ? Math.floor(Number(context.propsValue.topN)) : 10;
        const generateExcel = context.propsValue.generateExcel ?? true;
        const generateEmailTemplate = context.propsValue.generateEmailTemplate ?? true;

        const dateStr = reportDate();
        const clean = (v: any) => String(v ?? '').trim();

        // Excel is written as a stream to a temp file, so memory stays small even for large reports.
        // The state is kept in one object because TypeScript does not track changes made inside functions.
        const tmpPath = path.join(os.tmpdir(), `used_app_${Date.now()}_${Math.random().toString(36).slice(2)}.xlsx`);
        const xl: {
            wb: ExcelJS.stream.xlsx.WorkbookWriter | null;
            ws: ExcelJS.Worksheet | null;
            sheetCount: number;
            rowsInSheet: number;
        } = { wb: null, ws: null, sheetCount: 0, rowsInSheet: 0 };

        const openSheet = () => {
            if (!xl.wb) return;
            if (xl.ws) commitSheet(xl.ws);
            xl.sheetCount += 1;
            const sheet = xl.wb.addWorksheet(`Used Applications ${xl.sheetCount}`, {
                views: [{ state: 'frozen', ySplit: 1 }],
            });
            sheet.columns = COLUMN_WIDTHS.map(width => ({ width }));
            const head = sheet.addRow(HEADERS);
            head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
            head.commit();
            sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: HEADERS.length } };
            xl.ws = sheet;
            xl.rowsInSheet = 0;
        };

        if (generateExcel) {
            xl.wb = new ExcelJS.stream.xlsx.WorkbookWriter({ filename: tmpPath, useStyles: true, useSharedStrings: false });
            openSheet();
        }

        // Summary numbers for the email, collected while rows stream by
        let totalRecords = 0;
        const computers = new Set<string>();
        const publishers = new Set<string>();
        const productCounts = new Map<string, number>();
        let truncated = false;

        try {
            let pageNo = 1;
            while (totalRecords < maxRecords) {
                const res = await httpClient.sendRequest<any>({
                    method: HttpMethod.GET,
                    url: `${baseUrl}/report/getUsedApplictionByLimit`,
                    headers: { authorization: `Bearer ${context.auth.access_token}` },
                    queryParams: { pageNo: String(pageNo), perPage: String(pageSize) },
                    timeout: 180000,
                });

                const body: any = res.body;
                const page: any[] = Array.isArray(body)
                    ? body
                    : Array.isArray(body?.data)
                    ? body.data
                    : Array.isArray(body?.content)
                    ? body.content
                    : [];
                if (page.length === 0) break;

                for (const r of page) {
                    if (totalRecords >= maxRecords) {
                        truncated = true;
                        break;
                    }
                    if (!r || typeof r !== 'object') continue;

                    const a = r.asset ?? {};
                    const computerName = clean(a.computerName);
                    const productName = clean(r.productName);
                    const alias = clean(r.aliasProductName);
                    const associate = clean(r.associate?.associateName);

                    totalRecords += 1;
                    if (computerName) computers.add(computerName);
                    if (associate) publishers.add(associate);
                    const productKey = alias || productName || '-';
                    productCounts.set(productKey, (productCounts.get(productKey) ?? 0) + 1);

                    if (xl.ws) {
                        if (xl.rowsInSheet >= ROWS_PER_SHEET) openSheet();
                        xl.ws.addRow([
                            totalRecords,
                            computerName,
                            clean(a.employeeName),
                            clean(a.projectName),
                            clean(a.serialNo),
                            clean(a.model),
                            clean(a.make),
                            productName,
                            alias,
                            associate,
                            clean(a.systemIp),
                            fmtDateTime(r.lastRunningDate),
                        ]).commit();
                        xl.rowsInSheet += 1;
                    }
                }

                if (truncated) break;
                if (page.length < pageSize) break; // last page
                if (totalRecords >= maxRecords) {
                    truncated = true; // there may be more data than we took
                    break;
                }
                pageNo += 1;
            }

            let excelFile: string | null = null;
            let excelFileName: string | null = null;
            let fileSizeBytes = 0;

            if (xl.wb && xl.ws) {
                commitSheet(xl.ws);
                await xl.wb.commit();
                const data = await fs.readFile(tmpPath);
                fileSizeBytes = data.length;
                excelFileName = `Used_Application_Report_${dateStr}.xlsx`;
                excelFile = await context.files.write({ fileName: excelFileName, data });
            }

            const topProducts: TopProduct[] = [...productCounts.entries()]
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, topN);

            const fileSize = generateExcel ? formatSize(fileSizeBytes) : null;

            let htmlBody: string | null = null;
            if (generateEmailTemplate) {
                htmlBody = buildHtml({
                    title,
                    dateStr,
                    hasExcel: generateExcel,
                    truncated,
                    maxRecords,
                    totalRecords,
                    totalComputers: computers.size,
                    totalProducts: productCounts.size,
                    totalPublishers: publishers.size,
                    sheetCount: xl.sheetCount,
                    fileSize,
                    topProducts,
                });
            }

            return {
                title,
                reportDate: dateStr,
                totalRecords,
                totalComputers: computers.size,
                totalProducts: productCounts.size,
                totalPublishers: publishers.size,
                sheetCount: xl.sheetCount,
                truncated,
                topProducts,
                fileSize,
                hasData: totalRecords > 0,
                subject: `${title} - ${dateStr}`,
                htmlBody,
                excelFileName,
                excelFile,
            };
        } finally {
            await fs.unlink(tmpPath).catch(() => undefined);
        }
    },
});
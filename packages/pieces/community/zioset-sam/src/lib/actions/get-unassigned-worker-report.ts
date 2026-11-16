import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import ExcelJS from 'exceljs';

const esc = (s: any) =>
    String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const num = (n: any) => Number(n ?? 0).toLocaleString('en-IN');
const dash = (s: any) => (String(s ?? '').trim() === '' ? '-' : String(s).trim());

// Date in IST (dd-mm-yyyy), so the report date is correct even if the server runs in UTC
const reportDate = () =>
    new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }).replace(/\//g, '-');

type SortKey = 'employeeName' | 'employeeNo' | 'projectName' | 'assetId' | 'model';

type Row = {
    srNo: number;
    employeeName: string;
    employeeNo: string;
    projectName: string;
    assetId: string;
    serialNo: string;
    model: string;
    make: string;
};

function buildHtml(opts: {
    title: string;
    dateStr: string;
    hasExcel: boolean;
    totalAssets: number;
    totalEmployees: number;
    totalProjects: number;
    shownRows: Row[];
}): string {
    const { title, dateStr, hasExcel, totalAssets, totalEmployees, totalProjects, shownRows } = opts;

    const tableRows = shownRows
        .map(
            (r, i) => `
<tr class="${i % 2 ? 'alt' : ''}">
  <td data-label="Sr No" class="num">${r.srNo}</td>
  <td data-label="Employee Name" class="name">${esc(dash(r.employeeName))}</td>
  <td data-label="Employee No">${esc(dash(r.employeeNo))}</td>
  <td data-label="Project Name">${esc(dash(r.projectName))}</td>
  <td data-label="Asset ID">${esc(dash(r.assetId))}</td>
  <td data-label="Serial No">${esc(dash(r.serialNo))}</td>
  <td data-label="Model">${esc(dash(r.model))}</td>
  <td data-label="Make">${esc(dash(r.make))}</td>
</tr>`
        )
        .join('');

    const truncated = totalAssets > shownRows.length;
    const note = truncated
        ? `Showing the first ${num(shownRows.length)} of ${num(totalAssets)} assets.${
              hasExcel ? ' The complete list is attached as an Excel file with this email.' : ''
          }`
        : hasExcel
        ? 'The detailed list is attached as an Excel file with this email.'
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
  .card{max-width:980px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,.10);}
  .header{background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#fff;padding:28px 24px;}
  .header h1{margin:0;font-size:22px;font-weight:700;}
  .header p{margin:6px 0 0;font-size:13px;opacity:.9;}
  .content{padding:22px 24px;}
  .kpis{width:100%;border-collapse:separate;border-spacing:10px 0;margin:0 -10px 20px;}
  .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 10px;text-align:center;}
  .kpi .v{font-size:24px;font-weight:700;display:block;}
  .kpi .l{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;}
  .k-total .v{color:#1d4ed8;} .k-emp .v{color:#7c3aed;} .k-proj .v{color:#16a34a;}
  table.data{width:100%;border-collapse:collapse;font-size:13px;}
  table.data th{background:#eef2ff;color:#3730a3;text-align:left;padding:10px 10px;font-size:12px;text-transform:uppercase;letter-spacing:.4px;}
  table.data td{padding:9px 10px;border-bottom:1px solid #e2e8f0;vertical-align:middle;word-break:break-word;}
  table.data tr.alt td{background:#fafbff;}
  td.num,th.num{text-align:right;}
  td.name{font-weight:600;}
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
        <td class="kpi k-total"><span class="v">${num(totalAssets)}</span><span class="l">Total Assets</span></td>
        <td class="kpi k-emp"><span class="v">${num(totalEmployees)}</span><span class="l">Employees</span></td>
        <td class="kpi k-proj"><span class="v">${num(totalProjects)}</span><span class="l">Projects</span></td>
      </tr></table>

      <table class="data">
        <thead><tr>
          <th class="num">Sr No</th><th>Employee Name</th><th>Employee No</th><th>Project Name</th>
          <th>Asset ID</th><th>Serial No</th><th>Model</th><th>Make</th>
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

export const unassignedWorkerReport = createAction({
    auth: zioSetAuth,
    name: 'unassigned_worker_report',
    displayName: 'Unassigned Worker Report',
    description: 'Gets the unassigned worker report (employee, project, asset, serial, model, make). Optionally builds an Excel file and a responsive email body',
    aiMetadata: {
        description:
            'Reads the Unassigned Worker report from the SAM (Software Asset Management) system and returns one row per asset with ' +
            'Employee Name, Employee No, Project Name, Asset ID, Serial No, Model and Make. ' +
            'The output has counts (total assets, employees, projects), an optional Excel file with ALL rows, and an optional HTML email body ' +
            'that shows only the first N rows (prop Rows In Email), because the full report can have more than 20,000 rows. ' +
            'Options: records limit, sort column, Excel on/off, email template on/off. ' +
            'It only reads data and builds report files, so repeating the call with the same input is safe. ' +
            'Use the "Wise Asset Summary" actions instead when you only need counts grouped by location, site, supplier, material, category or status.',
        idempotent: true,
    },
    props: {
        title: Property.ShortText({
            displayName: 'Report Title',
            required: false,
            defaultValue: 'Unassigned Worker Report',
        }),
        perPage: Property.Number({
            displayName: 'Records Limit',
            description: 'Maximum number of records to fetch from the API (perPage)',
            required: false,
            defaultValue: 30000,
        }),
        sortBy: Property.StaticDropdown({
            displayName: 'Sort By',
            required: false,
            defaultValue: 'employeeName',
            options: {
                options: [
                    { label: 'Employee Name', value: 'employeeName' },
                    { label: 'Employee No', value: 'employeeNo' },
                    { label: 'Project Name', value: 'projectName' },
                    { label: 'Asset ID', value: 'assetId' },
                    { label: 'Model', value: 'model' },
                ],
            },
        }),
        emailRowLimit: Property.Number({
            displayName: 'Rows In Email',
            description: 'How many rows to show in the email body. The Excel file always has all rows.',
            required: false,
            defaultValue: 50,
        }),
        generateExcel: Property.Checkbox({
            displayName: 'Generate Excel',
            description: 'Turn ON to create the Excel file (Sr No, Employee Name, Employee No, Project Name, Asset ID, Serial No, Model, Make)',
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
        const title = context.propsValue.title || 'Unassigned Worker Report';
        const perPage = Number(context.propsValue.perPage) > 0 ? Number(context.propsValue.perPage) : 30000;
        const sortBy = ((context.propsValue.sortBy as string) || 'employeeName') as SortKey;
        const emailRowLimit = Number(context.propsValue.emailRowLimit) > 0 ? Number(context.propsValue.emailRowLimit) : 50;
        const generateExcel = context.propsValue.generateExcel ?? true;
        const generateEmailTemplate = context.propsValue.generateEmailTemplate ?? true;

        const res = await httpClient.sendRequest<any>({
            method: HttpMethod.GET,
            url: `${baseUrl}/report/getUnaasignedWorkerByLimits`,
            headers: { authorization: `Bearer ${context.auth.access_token}` },
            queryParams: { pageNo: '1', perPage: String(perPage) },
            timeout: 120000,
        });

        // The API normally returns a plain array; also accept a wrapped list just in case
        const body: any = res.body;
        const raw: any[] = Array.isArray(body)
            ? body
            : Array.isArray(body?.data)
            ? body.data
            : Array.isArray(body?.content)
            ? body.content
            : [];

        const clean = (v: any) => String(v ?? '').trim();

        const rows = raw
            .filter(r => r && typeof r === 'object')
            .map(r => ({
                employeeName: clean(r.employeeName),
                employeeNo: clean(r.employeeNo),
                projectName: clean(r.projectName),
                assetId: clean(r.assetId),
                serialNo: clean(r.serialNo),
                model: clean(r.model),
                make: clean(r.make),
            }));

        // Sort by the chosen column; empty values always go to the end
        rows.sort((a, b) => {
            const x = a[sortBy];
            const y = b[sortBy];
            if (!x && !y) return 0;
            if (!x) return 1;
            if (!y) return -1;
            return x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
        });

        // Sr No is assigned after sorting so it always runs 1..N in the shown order
        const finalRows: Row[] = rows.map((r, i) => ({ srNo: i + 1, ...r }));

        const totalAssets = finalRows.length;
        const totalEmployees = new Set(finalRows.map(r => r.employeeNo).filter(Boolean)).size;
        const totalProjects = new Set(finalRows.map(r => r.projectName).filter(Boolean)).size;

        const dateStr = reportDate();

        let excelFile: string | null = null;
        let excelFileName: string | null = null;
        if (generateExcel) {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Asset List');
            ws.columns = [
                { header: 'Sr No', key: 'srNo', width: 8 },
                { header: 'Employee Name', key: 'employeeName', width: 28 },
                { header: 'Employee No', key: 'employeeNo', width: 14 },
                { header: 'Project Name', key: 'projectName', width: 30 },
                { header: 'Asset ID', key: 'assetId', width: 24 },
                { header: 'Serial No', key: 'serialNo', width: 20 },
                { header: 'Model', key: 'model', width: 28 },
                { header: 'Make', key: 'make', width: 16 },
            ];
            const head = ws.getRow(1);
            head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
            ws.views = [{ state: 'frozen', ySplit: 1 }];
            finalRows.forEach(r => ws.addRow(r));
            ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 8 } };

            const buffer = await wb.xlsx.writeBuffer();
            excelFileName = `Asset_List_Report_${dateStr}.xlsx`;
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
                totalAssets,
                totalEmployees,
                totalProjects,
                shownRows: finalRows.slice(0, emailRowLimit),
            });
        }

        return {
            title,
            reportDate: dateStr,
            totalAssets,
            totalEmployees,
            totalProjects,
            rowsInEmail: Math.min(emailRowLimit, totalAssets),
            hasData: totalAssets > 0,
            subject: `${title} - ${dateStr}`,
            htmlBody,
            excelFileName,
            excelFile,
        };
    },
});
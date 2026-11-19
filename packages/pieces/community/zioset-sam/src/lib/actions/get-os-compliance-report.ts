import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';
import ExcelJS from 'exceljs';

// ---------------------------------------------------------------------------
// API settings: the only place to change if the endpoint path changes.
// This API returns the full list (no pagination), so there is no paging query.
// ---------------------------------------------------------------------------
const ENDPOINT = '/newConvenience/getOSWiseComplianceData';

const esc = (s: any) =>
    String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const textToHtml = (s: string) => esc(s).replace(/\r?\n/g, '<br>');
const num = (n: any) => Number(n ?? 0).toLocaleString('en-IN');
const pct = (n: any) => `${Number(n ?? 0).toFixed(2)}%`;
const round2 = (n: number) => Math.round(n * 100) / 100;

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

type SortKey = 'count' | 'name' | 'compliance' | 'nonCompliance';

type Row = {
    srNo: number;
    id: number;
    name: string;
    count: number;
    compliance: number;
    nonCompliance: number;
    compliancePer: number;
    nonCompliancePer: number;
    percentage: number;
};

function buildHtml(opts: {
    title: string;
    dateStr: string;
    topText: string;
    hasExcel: boolean;
    totalOs: number;
    totalDevices: number;
    totalCompliance: number;
    totalNonCompliance: number;
    shownRows: Row[];
}): string {
    const { title, dateStr, topText, hasExcel, totalOs, totalDevices, totalCompliance, totalNonCompliance, shownRows } = opts;

    const tableRows = shownRows
        .map((r, i) => `
<tr class="${i % 2 ? 'alt' : ''}">
  <td data-label="S No" class="num">${r.srNo}</td>
  <td data-label="OS Name" class="name">${esc(r.name)}</td>
  <td data-label="Devices" class="num">${num(r.count)}</td>
  <td data-label="Compliant" class="num ok">${num(r.compliance)}</td>
  <td data-label="Non Compliant" class="num bad">${num(r.nonCompliance)}</td>
  <td data-label="Compliance %" class="num">${pct(r.compliancePer)}</td>
  <td data-label="Non Compliance %" class="num">${pct(r.nonCompliancePer)}</td>
  <td data-label="Share">
    <div class="track"><div class="fill" style="width:${Math.min(100, r.percentage)}%"></div></div>
    <span class="pct">${pct(r.percentage)}</span>
  </td>
</tr>`)
        .join('');

    const emptyRow = shownRows.length === 0
        ? `<tr><td colspan="8" style="padding:18px;text-align:center;color:#64748b;">No data found.</td></tr>`
        : '';

    const truncated = totalOs > shownRows.length;
    const note = truncated
        ? `Showing the first ${num(shownRows.length)} of ${num(totalOs)} operating systems.${
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
  .intro{max-width:980px;margin:0 auto 18px;padding:0 4px;font-size:15px;line-height:1.7;color:#1e293b;word-break:break-word;}
  .card{max-width:980px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,.10);}
  .header{background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#fff;padding:28px 24px;}
  .header h1{margin:0;font-size:22px;font-weight:700;}
  .header p{margin:6px 0 0;font-size:13px;opacity:.9;}
  .content{padding:22px 24px;}
  .kpis{width:100%;border-collapse:separate;border-spacing:10px 0;margin:0 -10px 20px;}
  .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 10px;text-align:center;}
  .kpi .v{font-size:24px;font-weight:700;display:block;}
  .kpi .l{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;}
  .k-dev .v{color:#1d4ed8;} .k-ok .v{color:#16a34a;} .k-bad .v{color:#dc2626;} .k-os .v{color:#7c3aed;}
  table.data{width:100%;border-collapse:collapse;font-size:13px;}
  table.data th{background:#eef2ff;color:#3730a3;text-align:left;padding:10px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.4px;}
  table.data td{padding:9px 8px;border-bottom:1px solid #e2e8f0;vertical-align:middle;word-break:break-word;}
  table.data tr.alt td{background:#fafbff;}
  td.num,th.num{text-align:right;}
  td.name{font-weight:600;}
  td.ok{color:#15803d;font-weight:600;} td.bad{color:#b91c1c;font-weight:600;}
  .track{display:inline-block;width:70px;height:8px;background:#e2e8f0;border-radius:6px;overflow:hidden;vertical-align:middle;}
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
        <td class="kpi k-dev"><span class="v">${num(totalDevices)}</span><span class="l">Devices</span></td>
        <td class="kpi k-ok"><span class="v">${num(totalCompliance)}</span><span class="l">Compliant</span></td>
        <td class="kpi k-bad"><span class="v">${num(totalNonCompliance)}</span><span class="l">Non Compliant</span></td>
        <td class="kpi k-os"><span class="v">${num(totalOs)}</span><span class="l">Operating Systems</span></td>
      </tr></table>

      <table class="data">
        <thead><tr>
          <th class="num">S No</th><th>OS Name</th><th class="num">Devices</th><th class="num">Compliant</th>
          <th class="num">Non Compliant</th><th class="num">Compliance %</th><th class="num">Non Compliance %</th><th>Share</th>
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

export const osWiseComplianceReport = createAction({
    auth: zioSetAuth,
    name: 'os_wise_compliance_report',
    displayName: 'OsWiseComplianceReport',
    description: 'Gets the operating system wise compliance data (devices, compliant, non compliant and percentages). Optionally builds an Excel file and a responsive email body',
    aiMetadata: {
        description:
            'Reads the operating system wise compliance data from ZioSet and returns one row for each operating system (for example Microsoft Windows 11 Pro) with ID, Devices count, ' +
            'Compliant count, Non Compliant count, Compliance %, Non Compliance % and Share % (the share of that OS in all devices). ' +
            'Totals: total devices, total compliant, total non compliant and number of operating systems. ' +
            'If there is no data, the report is empty and hasData is false. ' +
            'The action uses all data returned by the API and applies no record limit. ' +
            'Options: sort column, rows in email (empty or 0 means all rows), email top text (optional message shown at the very top of the email, above the report), Excel on/off, email template on/off. ' +
            'The optional Excel file always has all rows and all API fields with a Total row. The optional HTML email body has KPI cards (always based on all rows) and a table, ' +
            'limited to the first N rows of the chosen sort order when Rows In Email is set. ' +
            'It only reads data and builds report files, so repeating the call with the same input is safe. ' +
            'Use the OsBuildReport action for builds and the OsLifecycleReport action for support status.',
        idempotent: true,
    },
    props: {
        title: Property.ShortText({
            displayName: 'Report Title',
            required: false,
            defaultValue: 'OS Wise Compliance Report',
        }),
        emailTopText: Property.LongText({
            displayName: 'Email Top Text',
            description: 'Optional message shown at the very top of the email, above the report. Example: Dear Sir, please find the OS wise compliance report below. Leave empty to show nothing.',
            required: false,
        }),
        sortBy: Property.StaticDropdown({
            displayName: 'Sort By',
            required: false,
            defaultValue: 'count',
            options: {
                options: [
                    { label: 'Devices (high to low)', value: 'count' },
                    { label: 'OS Name', value: 'name' },
                    { label: 'Compliant (high to low)', value: 'compliance' },
                    { label: 'Non Compliant (high to low)', value: 'nonCompliance' },
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
        const title = context.propsValue.title || 'OS Wise Compliance Report';
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

        const valid = raw.filter(r => r && String(r.name ?? '').trim() !== '');
        const skippedRows = raw.length - valid.length;

        const mapped = valid.map(r => ({
            id: Number(r.id ?? 0),
            name: String(r.name).trim(),
            count: Number(r.count ?? 0),
            compliance: Number(r.compliance ?? 0),
            nonCompliance: Number(r.nonCompliance ?? 0),
            compliancePer: Number(r.compliancePer ?? 0),
            nonCompliancePer: Number(r.nonCompliancePer ?? 0),
            percentage: Number(r.percentage ?? 0),
        }));

        mapped.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
                case 'compliance':
                    return b.compliance - a.compliance;
                case 'nonCompliance':
                    return b.nonCompliance - a.nonCompliance;
                default:
                    return b.count - a.count;
            }
        });

        // S No. is assigned after sorting so it always runs 1..N in the shown order
        const finalRows: Row[] = mapped.map((r, i) => ({ srNo: i + 1, ...r }));

        // KPI cards and the Total row always use all rows
        const totalOs = finalRows.length;
        const sum = (f: (r: Row) => number) => finalRows.reduce((s, r) => s + f(r), 0);
        const totalDevices = sum(r => r.count);
        const totalCompliance = sum(r => r.compliance);
        const totalNonCompliance = sum(r => r.nonCompliance);

        const shownRows = emailRowLimit > 0 ? finalRows.slice(0, emailRowLimit) : finalRows;
        const dateStr = reportDate();

        let excelFile: string | null = null;
        let excelFileName: string | null = null;
        if (generateExcel) {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('OS Wise Compliance');
            ws.columns = [
                { header: 'S No', key: 'srNo', width: 8 },
                { header: 'ID', key: 'id', width: 8 },
                { header: 'OS Name', key: 'name', width: 36 },
                { header: 'Devices', key: 'count', width: 12 },
                { header: 'Compliant', key: 'compliance', width: 12 },
                { header: 'Non Compliant', key: 'nonCompliance', width: 16 },
                { header: 'Compliance %', key: 'compliancePer', width: 16 },
                { header: 'Non Compliance %', key: 'nonCompliancePer', width: 18 },
                { header: 'Share %', key: 'percentage', width: 12 },
            ];
            const head = ws.getRow(1);
            head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
            ws.views = [{ state: 'frozen', ySplit: 1 }];
            finalRows.forEach(r => ws.addRow(r));
            const totalRow = ws.addRow({
                srNo: '',
                id: '',
                name: 'Total',
                count: totalDevices,
                compliance: totalCompliance,
                nonCompliance: totalNonCompliance,
                compliancePer: round2(sum(r => r.compliancePer)),
                nonCompliancePer: round2(sum(r => r.nonCompliancePer)),
                percentage: round2(sum(r => r.percentage)),
            });
            totalRow.font = { bold: true };
            totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
            ['compliancePer', 'nonCompliancePer', 'percentage'].forEach(k => {
                ws.getColumn(k).numFmt = '0.00';
            });

            const buffer = await wb.xlsx.writeBuffer();
            excelFileName = `OS_Wise_Compliance_Report_${dateStr}.xlsx`;
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
                totalOs,
                totalDevices,
                totalCompliance,
                totalNonCompliance,
                shownRows,
            });
        }

        return {
            title,
            reportDate: dateStr,
            apiRecordCount: raw.length,
            skippedRows,
            totalOperatingSystems: totalOs,
            totalDevices,
            totalCompliance,
            totalNonCompliance,
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
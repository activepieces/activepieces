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

// Report date in IST, so the value is correct even if the server runs in UTC
const reportDate = () =>
    new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }).replace(/\//g, '-');

type SortKey =
    | 'name'
    | 'licenceCount'
    | 'installCount'
    | 'userCount'
    | 'complianceCount'
    | 'nonComplianceCount';

type Row = {
    name: string;
    licenceCount: number;
    installCount: number;
    userCount: number;
    complianceCount: number;
    nonComplianceCount: number;
    latestVersion: string;
};

// Compliance % = compliant / (compliant + non-compliant). Returns null when both are 0.
const compliancePct = (r: { complianceCount: number; nonComplianceCount: number }): number | null => {
    const t = r.complianceCount + r.nonComplianceCount;
    return t > 0 ? Math.round((r.complianceCount / t) * 1000) / 10 : null;
};

function buildHtml(opts: {
    title: string;
    dateStr: string;
    hasExcel: boolean;
    totals: Omit<Row, 'name' | 'latestVersion'>;
    totalRows: number;
    shownRows: Row[];
}): string {
    const { title, dateStr, hasExcel, totals, totalRows, shownRows } = opts;
    const overall = compliancePct(totals);

    const tableRows = shownRows
        .map((r, i) => {
            const p = compliancePct(r);
            const bar =
                p === null
                    ? '<span class="pct">N/A</span>'
                    : `<div class="track"><div class="fill" style="width:${Math.min(100, p)}%"></div></div><span class="pct">${p}%</span>`;
            return `
<tr class="${i % 2 ? 'alt' : ''}">
  <td data-label="Name" class="name">${esc(r.name)}</td>
  <td data-label="Licence" class="num">${num(r.licenceCount)}</td>
  <td data-label="Installs" class="num">${num(r.installCount)}</td>
  <td data-label="Users" class="num">${num(r.userCount)}</td>
  <td data-label="Compliant" class="num good">${num(r.complianceCount)}</td>
  <td data-label="Non-Compliant" class="num bad">${num(r.nonComplianceCount)}</td>
  <td data-label="Compliance %">${bar}</td>
  <td data-label="Latest Version">${esc(r.latestVersion || '-')}</td>
</tr>`;
        })
        .join('');

    const truncated = totalRows > shownRows.length;
    const note = truncated
        ? `Showing the first ${num(shownRows.length)} of ${num(totalRows)} products.${
              hasExcel ? ' The complete list is attached as an Excel file with this email.' : ''
          }`
        : hasExcel
        ? 'The detailed compliance data is attached as an Excel file with this email.'
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
  .k-inst .v{color:#1d4ed8;} .k-good .v{color:#16a34a;} .k-bad .v{color:#dc2626;} .k-pct .v{color:#7c3aed;}
  table.data{width:100%;border-collapse:collapse;font-size:13px;}
  table.data th{background:#eef2ff;color:#3730a3;text-align:left;padding:10px 10px;font-size:12px;text-transform:uppercase;letter-spacing:.4px;}
  table.data td{padding:10px 10px;border-bottom:1px solid #e2e8f0;vertical-align:middle;word-break:break-word;}
  table.data tr.alt td{background:#fafbff;}
  td.num,th.num{text-align:right;}
  td.name{font-weight:600;}
  td.good{color:#15803d;font-weight:600;} td.bad{color:#dc2626;font-weight:600;}
  .track{display:inline-block;width:80px;height:8px;background:#e2e8f0;border-radius:6px;overflow:hidden;vertical-align:middle;}
  .fill{height:8px;background:linear-gradient(90deg,#22c55e,#16a34a);}
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
      <h1>${esc(title)}</h1>
      <p>As on ${esc(dateStr)}</p>
    </div>
    <div class="content">
      <table class="kpis" role="presentation"><tr>
        <td class="kpi k-inst"><span class="v">${num(totals.installCount)}</span><span class="l">Installs</span></td>
        <td class="kpi k-good"><span class="v">${num(totals.complianceCount)}</span><span class="l">Compliant</span></td>
        <td class="kpi k-bad"><span class="v">${num(totals.nonComplianceCount)}</span><span class="l">Non-Compliant</span></td>
        <td class="kpi k-pct"><span class="v">${overall === null ? 'N/A' : overall + '%'}</span><span class="l">Compliance</span></td>
      </tr></table>

      <table class="data">
        <thead><tr>
          <th>Name</th><th class="num">Licence</th><th class="num">Installs</th><th class="num">Users</th>
          <th class="num">Compliant</th><th class="num">Non-Compliant</th><th>Compliance %</th><th>Latest Version</th>
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

export const complianceReport = createAction({
    auth: zioSetAuth,
    name: 'compliance_report',
    displayName: 'Compliance Report',
    description: 'Gets the compliance report (licence, install, user, compliant and non-compliant counts per product). Optionally builds an Excel file and a responsive email body',
    aiMetadata: {
        description:
            'Reads the Compliance report from ZioSet and returns, for each product or agent (for example CrowdStrike Windows Sensor, Trellix Agent): ' +
            'Licence Count, Install Count, User Count, Compliance Count, Non-Compliance Count and Latest Version, plus totals and an overall compliance percentage ' +
            '(compliant divided by compliant plus non-compliant). ' +
            'Options: sort column, rows in email (empty or 0 means all rows), Excel on/off, email template on/off. ' +
            'The optional Excel file always has all rows with a Total row. The optional HTML email body has KPI cards (always based on all rows) ' +
            'and a table with a compliance bar for each product, limited to the first N rows of the chosen sort order when Rows In Email is set. ' +
            'It only reads data and builds report files, so repeating the call with the same input is safe. ' +
            'Use the "Wise Asset Summary" actions for hardware counts and Used Application Report for application usage per computer.',
        idempotent: true,
    },
    props: {
        title: Property.ShortText({
            displayName: 'Report Title',
            required: false,
            defaultValue: 'Compliance Report',
        }),
        sortBy: Property.StaticDropdown({
            displayName: 'Sort By',
            required: false,
            defaultValue: 'name',
            options: {
                options: [
                    { label: 'Name', value: 'name' },
                    { label: 'Licence Count (high to low)', value: 'licenceCount' },
                    { label: 'Install Count (high to low)', value: 'installCount' },
                    { label: 'User Count (high to low)', value: 'userCount' },
                    { label: 'Compliance Count (high to low)', value: 'complianceCount' },
                    { label: 'Non-Compliance Count (high to low)', value: 'nonComplianceCount' },
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
            description: 'Turn ON to create the Excel file (Name, Licence Count, Install Count, User Count, Compliance Count, Non-Compliance Count, Latest Version)',
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
        const title = context.propsValue.title || 'Compliance Report';
        const sortBy = ((context.propsValue.sortBy as string) || 'name') as SortKey;
        const emailRowLimit = Number(context.propsValue.emailRowLimit) > 0 ? Math.floor(Number(context.propsValue.emailRowLimit)) : 0; // 0 = all rows
        const generateExcel = context.propsValue.generateExcel ?? true;
        const generateEmailTemplate = context.propsValue.generateEmailTemplate ?? true;

        const res = await httpClient.sendRequest<any[]>({
            method: HttpMethod.GET,
            url: `${baseUrl}/report/getComplienceRerport`,
            headers: { authorization: `Bearer ${context.auth.access_token}` },
            timeout: 120000,
        });

        const raw: any[] = Array.isArray(res.body) ? res.body : [];

        const rows: Row[] = raw
            .filter(r => r && String(r.name ?? '').trim() !== '')
            .map(r => ({
                name: String(r.name).trim(),
                licenceCount: Number(r.licenceCount ?? 0),
                installCount: Number(r.installCount ?? 0),
                userCount: Number(r.userCount ?? 0),
                complianceCount: Number(r.complienceCount ?? 0),
                nonComplianceCount: Number(r.noncomplienceCount ?? 0),
                latestVersion: String(r.latestVersion ?? '').trim(),
            }))
            .sort((a, b) => (sortBy === 'name' ? a.name.localeCompare(b.name) : b[sortBy] - a[sortBy]));

        // KPI cards and the Total row always use all rows
        const totals = rows.reduce(
            (s, r) => ({
                licenceCount: s.licenceCount + r.licenceCount,
                installCount: s.installCount + r.installCount,
                userCount: s.userCount + r.userCount,
                complianceCount: s.complianceCount + r.complianceCount,
                nonComplianceCount: s.nonComplianceCount + r.nonComplianceCount,
            }),
            { licenceCount: 0, installCount: 0, userCount: 0, complianceCount: 0, nonComplianceCount: 0 }
        );

        const shownRows = emailRowLimit > 0 ? rows.slice(0, emailRowLimit) : rows;
        const dateStr = reportDate();

        let excelFile: string | null = null;
        let excelFileName: string | null = null;
        if (generateExcel) {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Compliance');
            ws.columns = [
                { header: 'Name', key: 'name', width: 34 },
                { header: 'Licence Count', key: 'licenceCount', width: 16 },
                { header: 'Install Count', key: 'installCount', width: 16 },
                { header: 'User Count', key: 'userCount', width: 14 },
                { header: 'Compliance Count', key: 'complianceCount', width: 18 },
                { header: 'Non-Compliance Count', key: 'nonComplianceCount', width: 22 },
                { header: 'Latest Version', key: 'latestVersion', width: 18 },
            ];
            const head = ws.getRow(1);
            head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
            ws.views = [{ state: 'frozen', ySplit: 1 }];
            rows.forEach(r => ws.addRow(r));
            const totalRow = ws.addRow({ name: 'Total', ...totals, latestVersion: '' });
            totalRow.font = { bold: true };
            totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };

            const buffer = await wb.xlsx.writeBuffer();
            excelFileName = `Compliance_Report_${dateStr}.xlsx`;
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
                totalRows: rows.length,
                shownRows,
            });
        }

        return {
            title,
            reportDate: dateStr,
            totalProducts: rows.length,
            rowsInEmail: generateEmailTemplate ? shownRows.length : 0,
            totals,
            overallCompliancePercent: compliancePct(totals),
            rows,
            hasData: rows.length > 0,
            subject: `${title} - ${dateStr}`,
            htmlBody,
            excelFileName,
            excelFile,
        };
    },
});
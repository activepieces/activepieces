import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioSetAuth } from '../common/auth';

const esc = (s: any) =>
    String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

// Date and time in IST, so the values are correct even if the server runs in UTC
const reportDate = () =>
    new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }).replace(/\//g, '-');
const reportDateTime = () =>
    new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }).replace(/\//g, '-') + ' IST';

const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
};

// Column order of the Excel returned by /download/export
const COLUMNS = [
    'SNo',
    'Product',
    'Publisher',
    'Version',
    'Install Date',
    'Detected Date',
    'Computer Name',
    'Employee Name',
    'Employee No',
    'Email',
    'Project Name',
    'Model',
    'Serial No',
    'Asset Id',
];

function buildHtml(opts: {
    title: string;
    dateStr: string;
    generatedAt: string;
    hasExcel: boolean;
    fileName: string | null;
    fileSize: string | null;
}): string {
    const { title, dateStr, generatedAt, hasExcel, fileName, fileSize } = opts;

    const kpis = [
        ...(fileSize ? [`<td class="kpi"><span class="v" style="color:#1d4ed8">${esc(fileSize)}</span><span class="l">File Size</span></td>`] : []),
        `<td class="kpi"><span class="v" style="color:#7c3aed">${COLUMNS.length}</span><span class="l">Columns</span></td>`,
        `<td class="kpi"><span class="v" style="color:#16a34a">${hasExcel ? 'Attached' : 'Not attached'}</span><span class="l">Excel File</span></td>`,
    ].join('');

    const infoRows: [string, string][] = [
        ['Report', 'Install Licence Stock'],
        ['Includes', 'Installed licence records (operation type: ADDED)'],
        ['Generated On', generatedAt],
        ...(fileName ? ([['File Name', fileName]] as [string, string][]) : []),
        ...(fileSize ? ([['File Size', fileSize]] as [string, string][]) : []),
    ];

    const infoHtml = infoRows
        .map(
            ([k, v], i) =>
                `<tr class="${i % 2 ? 'alt' : ''}"><td class="key">${esc(k)}</td><td class="val">${esc(v)}</td></tr>`
        )
        .join('');

    const chips = COLUMNS.map(c => `<span class="chip">${esc(c)}</span>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
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
  table.info{width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;}
  table.info td{padding:10px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top;word-break:break-word;}
  table.info tr.alt td{background:#fafbff;}
  td.key{width:34%;font-size:12px;font-weight:600;color:#3730a3;text-transform:uppercase;letter-spacing:.4px;background:#eef2ff;}
  td.val{font-weight:600;}
  .sub{font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.4px;margin:0 0 8px;}
  .chip{display:inline-block;margin:0 6px 6px 0;padding:5px 10px;font-size:12px;color:#3730a3;background:#eef2ff;border:1px solid #c7d2fe;border-radius:999px;}
  .note{margin-top:18px;font-size:13px;color:#475569;line-height:1.5;}
  .footer{background:#f1f5f9;text-align:center;padding:16px;font-size:12px;color:#94a3b8;}

  @media only screen and (max-width:600px){
    .header{padding:22px 16px;} .content{padding:16px;}
    .kpis,.kpis tbody,.kpis tr,.kpis td{display:block;width:100%;}
    .kpis{border-spacing:0;margin:0 0 12px;}
    .kpis td{margin-bottom:10px;}
    td.key{width:38%;}
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
      <table class="kpis" role="presentation"><tr>${kpis}</tr></table>

      <table class="info" role="presentation">${infoHtml}</table>

      <p class="sub">Columns in the Excel file</p>
      <div>${chips}</div>

      <p class="note">${
          hasExcel
              ? 'The report data is in the attached Excel file. It is not shown in this email because of its size.'
              : 'The Excel file was not generated for this run.'
      }</p>
    </div>
    <div class="footer">This is an automated report. Please do not reply to this email.</div>
  </div>
</div>
</body>
</html>`;
}

export const licenseInventorySummaryReport = createAction({
    auth: zioSetAuth,
    name: 'license_inventory_summary_report',
    displayName: ' Licence Inventory Summary Report',
    description: 'Downloads the Install Licence Stock Excel file. Optionally builds a responsive email body with the file details (no data rows)',
    aiMetadata: {
        description:
            'Downloads the Install Licence Stock report from ZioSet as an Excel (.xlsx) file and returns it as a file reference. ' +
            'The file has one row per installed licence (operation type ADDED) with these columns: SNo, Product, Publisher, Version, Install Date, ' +
            'Detected Date, Computer Name, Employee Name, Employee No, Email, Project Name, Model, Serial No, Asset Id, and it can be very large. ' +
            'The optional HTML email body contains only details (file name, file size, generated time, column list) and never the data rows. ' +
            'The action returns the file and its details, not the rows, so use it to send or store the full report, not to look up single records. ' +
            'Options: Excel on/off, email template on/off, download timeout. ' +
            'It only reads data, so repeating the call with the same input is safe (each call downloads a fresh copy).',
        idempotent: true,
    },
    props: {
        title: Property.ShortText({
            displayName: 'Report Title',
            required: false,
            defaultValue: 'Licence Inventory Summary Report',
        }),
        timeoutMinutes: Property.Number({
            displayName: 'Download Timeout (minutes)',
            description: 'How long to wait for the server to build and send the Excel file',
            required: false,
            defaultValue: 10,
        }),
        generateExcel: Property.Checkbox({
            displayName: 'Generate Excel',
            description: 'Turn ON to download the Excel file and return it. Turn OFF to skip the download.',
            required: false,
            defaultValue: true,
        }),
        generateEmailTemplate: Property.Checkbox({
            displayName: 'Generate Email Template',
            description: 'Turn ON to create the responsive HTML email body (details only, no data rows)',
            required: false,
            defaultValue: true,
        }),
    },

    async run(context) {
        const baseUrl = context.auth.props.baseUrl;
        const title = context.propsValue.title || 'Install Licence Stock Report';
        const timeoutMinutes = Number(context.propsValue.timeoutMinutes) > 0 ? Number(context.propsValue.timeoutMinutes) : 10;
        const generateExcel = context.propsValue.generateExcel ?? true;
        const generateEmailTemplate = context.propsValue.generateEmailTemplate ?? true;

        const dateStr = reportDate();
        const generatedAt = reportDateTime();

        let excelFile: string | null = null;
        let excelFileName: string | null = null;
        let fileSizeBytes = 0;

        if (generateExcel) {
            const res = await httpClient.sendRequest<ArrayBuffer>({
                method: HttpMethod.GET,
                url: `${baseUrl}/download/export`,
                headers: { authorization: `Bearer ${context.auth.access_token}` },
                responseType: 'arraybuffer',
                timeout: timeoutMinutes * 60 * 1000,
            });

            const data = Buffer.from(res.body as any);

            // An .xlsx file is a zip, so it starts with "PK". Anything else is an error response
            if (data.length < 4 || data[0] !== 0x50 || data[1] !== 0x4b) {
                const preview = data.subarray(0, 200).toString('utf8');
                throw new Error(`The export API did not return an Excel file. Response starts with: ${preview}`);
            }

            fileSizeBytes = data.length;
            excelFileName = `Install_Licence_Stock_${dateStr}.xlsx`;
            excelFile = await context.files.write({ fileName: excelFileName, data });
        }

        const fileSize = generateExcel ? formatSize(fileSizeBytes) : null;

        let htmlBody: string | null = null;
        if (generateEmailTemplate) {
            htmlBody = buildHtml({
                title,
                dateStr,
                generatedAt,
                hasExcel: generateExcel,
                fileName: excelFileName,
                fileSize,
            });
        }

        return {
            title,
            reportDate: dateStr,
            generatedAt,
            columns: COLUMNS,
            fileSizeBytes,
            fileSize,
            hasData: generateExcel ? fileSizeBytes > 0 : false,
            subject: `${title} - ${dateStr}`,
            htmlBody,
            excelFileName,
            excelFile,
        };
    },
});
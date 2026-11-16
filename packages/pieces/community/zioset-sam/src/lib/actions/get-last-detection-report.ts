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

// Dates in IST, so the values are correct even if the server runs in UTC
const reportDate = () =>
    new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }).replace(/\//g, '-');
const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // yyyy-mm-dd

type SortKey = 'assetId' | 'serialNo' | 'computerName' | 'projectName' | 'model';

type AssetRow = {
    srNo: number;
    assetId: string;
    serialNo: string;
    computerName: string;
    make: string;
    model: string;
    projectName: string;
    present: boolean[]; // one value for each date
};

type DayStat = { date: string; detected: number; notDetected: number };

function buildHtml(opts: {
    title: string;
    dateStr: string;
    hasExcel: boolean;
    totalAssets: number;
    latestDate: string;
    latestDetected: number;
    latestNotDetected: number;
    days: DayStat[];
}): string {
    const { title, dateStr, hasExcel, totalAssets, latestDate, latestDetected, latestNotDetected, days } = opts;
    const pct = (d: number, t: number) => (t > 0 ? Math.round((d / t) * 1000) / 10 : 0);

    const tableRows = days
        .map((d, i) => {
            const p = pct(d.detected, totalAssets);
            return `
<tr class="${i % 2 ? 'alt' : ''}">
  <td data-label="Date" class="name">${esc(d.date)}</td>
  <td data-label="Detected" class="num">${num(d.detected)}</td>
  <td data-label="Not Detected" class="num">${num(d.notDetected)}</td>
  <td data-label="Detection %">
    <div class="track"><div class="fill" style="width:${Math.min(100, p)}%"></div></div>
    <span class="pct">${p}%</span>
  </td>
</tr>`;
        })
        .join('');

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
  .kpi .v{font-size:24px;font-weight:700;display:block;}
  .kpi .l{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;}
  .k-total .v{color:#1d4ed8;} .k-det .v{color:#16a34a;} .k-not .v{color:#dc2626;}
  .sub{font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.4px;margin:0 0 8px;}
  table.data{width:100%;border-collapse:collapse;font-size:14px;}
  table.data th{background:#eef2ff;color:#3730a3;text-align:left;padding:10px 12px;font-size:12px;text-transform:uppercase;letter-spacing:.4px;}
  table.data td{padding:10px 12px;border-bottom:1px solid #e2e8f0;vertical-align:middle;}
  table.data tr.alt td{background:#fafbff;}
  td.num,th.num{text-align:right;}
  td.name{font-weight:600;}
  .track{display:inline-block;width:110px;height:8px;background:#e2e8f0;border-radius:6px;overflow:hidden;vertical-align:middle;}
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
    table.data td:before{content:attr(data-label);font-weight:600;color:#64748b;text-align:left;font-size:12px;text-transform:uppercase;}
    td.name{background:#eef2ff;color:#3730a3;font-size:15px;justify-content:flex-start;}
    td.name:before{content:'';}
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
        <td class="kpi k-det"><span class="v">${num(latestDetected)}</span><span class="l">Detected on ${esc(latestDate)}</span></td>
        <td class="kpi k-not"><span class="v">${num(latestNotDetected)}</span><span class="l">Not Detected on ${esc(latestDate)}</span></td>
      </tr></table>

      <p class="sub">Day-wise detection</p>
      <table class="data">
        <thead><tr>
          <th>Date</th><th class="num">Detected</th><th class="num">Not Detected</th><th>Detection %</th>
        </tr></thead>
        <tbody>${tableRows}</tbody>
      </table>

      <p class="note">${
          hasExcel
              ? 'The asset-wise detection data (Present / Absent for each date) is attached as an Excel file with this email.'
              : 'The Excel file was not generated for this run.'
      }</p>
    </div>
    <div class="footer">This is an automated report. Please do not reply to this email.</div>
  </div>
</div>
</body>
</html>`;
}

export const lastDetectionReport = createAction({
    auth: zioSetAuth,
    name: 'last_detection_report',
    displayName: 'Last Detection Report',
    description: 'Gets the last detection report (asset-wise detection for the last 10 days). Optionally builds an Excel file and a responsive email summary',
    aiMetadata: {
        description:
            'Reads the Last Detection report from ZioSet: for every asset, whether it was detected (Present) or not (Absent) on each of the last 10 days ending at the report date. ' +
            'The output has the total number of assets, the number detected and not detected on the latest date, and a day-wise summary (detected, not detected). ' +
            'The optional Excel file has one row per asset (Sr No, Asset ID, Serial No, Computer Name, Make, Model, Project Name) and one Present/Absent column per date. ' +
            'The optional HTML email body has only counts and the day-wise summary, never the asset rows. ' +
            'Options: report date (yyyy-mm-dd, default today in IST), records limit, sort column, Excel on/off, email template on/off. ' +
            'It only reads data and builds report files, so repeating the call with the same input is safe. ' +
            'Use the "Wise Asset Summary" actions for counts by location, site, supplier, material, category or status.',
        idempotent: true,
    },
    props: {
        title: Property.ShortText({
            displayName: 'Report Title',
            required: false,
            defaultValue: 'Last Detection Report',
        }),
        reportDate: Property.ShortText({
            displayName: 'Report Date',
            description: 'Format yyyy-mm-dd. Leave empty to use today (IST). The report covers the 10 days ending on this date.',
            required: false,
        }),
        perPage: Property.Number({
            displayName: 'Records Limit',
            description: 'Maximum number of assets to fetch from the API (perPage)',
            required: false,
            defaultValue: 20000,
        }),
        sortBy: Property.StaticDropdown({
            displayName: 'Sort By',
            required: false,
            defaultValue: 'assetId',
            options: {
                options: [
                    { label: 'Asset ID', value: 'assetId' },
                    { label: 'Serial No', value: 'serialNo' },
                    { label: 'Computer Name', value: 'computerName' },
                    { label: 'Project Name', value: 'projectName' },
                    { label: 'Model', value: 'model' },
                ],
            },
        }),
        generateExcel: Property.Checkbox({
            displayName: 'Generate Excel',
            description: 'Turn ON to create the Excel file (Sr No, Asset ID, Serial No, Computer Name, Make, Model, Project Name and one column per date)',
            required: false,
            defaultValue: true,
        }),
        generateEmailTemplate: Property.Checkbox({
            displayName: 'Generate Email Template',
            description: 'Turn ON to create the responsive HTML email body (summary only, no asset rows)',
            required: false,
            defaultValue: true,
        }),
    },

    async run(context) {
        const baseUrl = context.auth.props.baseUrl;
        const title = context.propsValue.title || 'Last Detection Report';
        const perPage = Number(context.propsValue.perPage) > 0 ? Number(context.propsValue.perPage) : 20000;
        const sortBy = ((context.propsValue.sortBy as string) || 'assetId') as SortKey;
        const generateExcel = context.propsValue.generateExcel ?? true;
        const generateEmailTemplate = context.propsValue.generateEmailTemplate ?? true;

        const inputDate = String(context.propsValue.reportDate ?? '').trim();
        if (inputDate && !/^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
            throw new Error('Report Date must be in yyyy-mm-dd format, for example 2026-11-05');
        }
        const requestedDate = inputDate || todayIso();

        const res = await httpClient.sendRequest<any>({
            method: HttpMethod.GET,
            url: `${baseUrl}/report/getLastDetectionReportListByPagination`,
            headers: { authorization: `Bearer ${context.auth.access_token}` },
            queryParams: { pageNo: '1', perPage: String(perPage), date: requestedDate },
            timeout: 180000,
        });

        const body: any = res.body;
        const dates: string[] = Array.isArray(body?.dates) ? body.dates.map((d: any) => String(d)) : [];
        const datas: any[] = Array.isArray(body?.datas) ? body.datas : [];

        const clean = (v: any) => String(v ?? '').trim();

        const rows = datas
            .filter(d => d && d.asset)
            .map(d => ({
                assetId: clean(d.asset.assetId),
                serialNo: clean(d.asset.serialNo),
                computerName: clean(d.asset.computerName),
                make: clean(d.asset.make),
                model: clean(d.asset.model),
                projectName: clean(d.asset.projectName),
                // presentDay1 is the first date in `dates`, presentDay2 the second, and so on
                present: dates.map((_, i) => d[`presentDay${i + 1}`] === true),
            }));

        // Empty values always go to the end
        rows.sort((a, b) => {
            const x = a[sortBy];
            const y = b[sortBy];
            if (!x && !y) return 0;
            if (!x) return 1;
            if (!y) return -1;
            return x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
        });

        // Sr No is assigned after sorting so it always runs 1..N in the shown order
        const finalRows: AssetRow[] = rows.map((r, i) => ({ srNo: i + 1, ...r }));

        const totalAssets = finalRows.length;
        const days: DayStat[] = dates.map((date, i) => {
            const detected = finalRows.reduce((s, r) => s + (r.present[i] ? 1 : 0), 0);
            return { date, detected, notDetected: totalAssets - detected };
        });
        const latest = days.length ? days[days.length - 1] : { date: requestedDate, detected: 0, notDetected: 0 };

        const dateStr = reportDate();

        let excelFile: string | null = null;
        let excelFileName: string | null = null;
        if (generateExcel) {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Last Detection');
            ws.columns = [
                { header: 'Sr No', key: 'srNo', width: 8 },
                { header: 'Asset ID', key: 'assetId', width: 24 },
                { header: 'Serial No', key: 'serialNo', width: 18 },
                { header: 'Computer Name', key: 'computerName', width: 22 },
                { header: 'Make', key: 'make', width: 14 },
                { header: 'Model', key: 'model', width: 24 },
                { header: 'Project Name', key: 'projectName', width: 28 },
                ...dates.map((d, i) => ({ header: d, key: `d${i}`, width: 13 })),
            ];

            const head = ws.getRow(1);
            head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
            head.alignment = { horizontal: 'center', vertical: 'middle' };
            ws.views = [{ state: 'frozen', ySplit: 1 }];

            const firstDateCol = 8;
            finalRows.forEach(r => {
                const row = ws.addRow([
                    r.srNo,
                    r.assetId,
                    r.serialNo,
                    r.computerName,
                    r.make,
                    r.model,
                    r.projectName,
                    ...r.present.map(p => (p ? 'Present' : 'Absent')),
                ]);
                r.present.forEach((p, i) => {
                    const cell = row.getCell(firstDateCol + i);
                    cell.alignment = { horizontal: 'center' };
                    cell.font = { color: { argb: p ? 'FF15803D' : 'FFDC2626' } };
                });
            });

            // Last row: how many assets were present on each date
            const totalRow = ws.addRow(['', 'Total Present', '', '', '', '', '', ...days.map(d => d.detected)]);
            totalRow.font = { bold: true };
            totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
            days.forEach((_, i) => {
                totalRow.getCell(firstDateCol + i).alignment = { horizontal: 'center' };
            });

            ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 7 + dates.length } };

            const buffer = await wb.xlsx.writeBuffer();
            excelFileName = `Last_Detection_Report_${dateStr}.xlsx`;
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
                latestDate: latest.date,
                latestDetected: latest.detected,
                latestNotDetected: latest.notDetected,
                days,
            });
        }

        return {
            title,
            reportDate: dateStr,
            requestedDate,
            dates,
            totalAssets,
            detectedOnLatestDate: latest.detected,
            notDetectedOnLatestDate: latest.notDetected,
            dayWise: days,
            hasData: totalAssets > 0,
            subject: `${title} - ${dateStr}`,
            htmlBody,
            excelFileName,
            excelFile,
        };
    },
});
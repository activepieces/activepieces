import { createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const exportReport = createAction({
  auth: salesforceAuth,
  name: 'export_report',
  displayName: 'Export Report ',
  description: 'Export a Salesforce report as an Excel file.',
  props: {
    report_id: salesforcesCommon.report,
  },
  async run(context) {
    const { report_id } = context.propsValue;
    const access_token = context.auth.access_token;
    
    const response = await httpClient.sendRequest<ArrayBuffer>({
      method: HttpMethod.POST,
      url: `${context.auth.data['instance_url']}/services/data/v56.0/analytics/reports/${report_id}?export=1&enc=UTF-8&xf=excel`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token,
      },
      headers: {
        Accept:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      responseType: 'arraybuffer',
    });

    const report = (await callSalesforceApi(
      HttpMethod.GET,
      context.auth,
      `/services/data/v56.0/analytics/reports/${report_id}`,
      undefined
    )) as any;

    const reportName = report.body.attributes.reportName || report_id;

    return await context.files.write({
      fileName: `report_${reportName}.xlsx`,
      data: Buffer.from(response.body),
    });
  },
});

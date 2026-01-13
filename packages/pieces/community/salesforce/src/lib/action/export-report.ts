import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { salesforcesCommon } from '../common';


export const exportReport = createAction({
  auth: salesforceAuth,
  name: 'export_report',
  displayName: 'Export Report',
  description: 'Export a Salesforce report as an Excel file.',
  props: {
    report_id: salesforcesCommon.report,
  },
  async run(context) {
    const { report_id } = context.propsValue;
    const auth = context.auth.access_token;

    const response = await httpClient.sendRequest<ArrayBuffer>({
      method: HttpMethod.GET,
      url: `${context.auth.data['instance_url']}/services/data/v56.0/analytics/reports/${report_id}?export=1&enc=UTF-8&xf=excel`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      responseType: 'arraybuffer',
    });

    return {
      fileName: `report_${report_id}.xlsx`,
      data: Buffer.from(response.body).toString('base64'),
    };
  },
});

import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import { seekTableAuth } from '../../lib/common/auth';
import { seekTableApiCall } from '../../lib/common/client';

interface Report {
  Id: string;
  Name: string;
  ReportType: string;
  Config: string;
}

export const shareReportEmailAction = createAction({
  auth: seekTableAuth,
  name: 'share_report_email',
  displayName: 'Share Report by Email',
  description: 'Sends report in email body with optional attachments.',
  props: {
    reportId: Property.Dropdown({
      displayName: 'Report',
      description: 'Select the report to share',
      required: true,
      auth: seekTableAuth,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }

        try {
          const response = await seekTableApiCall({
            auth: (auth as any).secret_text,
            method: HttpMethod.GET,
            resourceUri: 'api/report',
          }) as Report[];

          return {
            options: response.map(report => ({
              label: report.Name,
              value: report.Id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Error loading reports',
          };
        }
      },
    }),
    to: Property.ShortText({
      displayName: 'Recipient Email',
      description: 'Email address of the recipient',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject line',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message (Optional)',
      description: 'Additional text content included in the email body',
      required: false,
    }),
    include_report_html: Property.Checkbox({
      displayName: 'Include Report HTML in Email Body',
      description: 'Place the report HTML directly into the email body',
      required: false,
      defaultValue: true,
    }),
    attach_export: Property.StaticMultiSelectDropdown({
      displayName: 'Attach Export Files',
      description: 'Select which export formats to attach to the email',
      required: false,
      options: {
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'CSV', value: 'csv' },
          { label: 'Excel', value: 'excel' },
          { label: 'Excel Pivot Table', value: 'excelpivottable' },
        ],
      },
    }),
    report_parameters: Property.Object({
      displayName: 'Report Parameters (Optional)',
      description: 'JSON object with report parameters like {"param_name": "value"}',
      required: false,
    }),
  },
  async run(context) {
    const {
      reportId,
      to,
      subject,
      message,
      include_report_html,
      attach_export,
      report_parameters
    } = context.propsValue;

    const formData = new FormData();

    formData.append('to', to);
    formData.append('subject', subject);

    if (message) {
      formData.append('message', message);
    }

    if (include_report_html !== undefined) {
      formData.append('include_report_html', include_report_html ? 'true' : 'false');
    }

    if (attach_export && attach_export.length > 0) {
      formData.append('attach_export', attach_export.join(','));
    }

    if (report_parameters && Object.keys(report_parameters).length > 0) {
      formData.append('report_parameters', JSON.stringify(report_parameters));
    }

    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `api/report/${reportId}/share/email`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      body: formData,
      headers: {
        ...formData.getHeaders(),
      },
    });

    return {
      success: true,
      message: 'Report shared successfully via email',
      details: {
        recipient: to,
        subject: subject,
        reportId: reportId,
      },
    };
  },
});

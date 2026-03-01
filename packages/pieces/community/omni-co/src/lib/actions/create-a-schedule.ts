import { createAction, Property } from '@activepieces/pieces-framework';
import { omniAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createASchedule = createAction({
  auth: omniAuth,
  name: 'createASchedule',
  displayName: 'Create a schedule',
  description:
    'Creates a scheduled task for a dashboard with support for email, SFTP, and webhook destinations',
  props: {
    identifier: Property.ShortText({
      displayName: 'Dashboard Identifier',
      description:
        ' The string after /dashboards is the dashboards ID; for example: https://blobsrus.omniapp.co/dashboards/12db1a0a',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Schedule Name',
      description: 'The name of the schedule/task',
      required: true,
    }),
    schedule: Property.ShortText({
      displayName: 'Schedule (Cron Expression)',
      description:
        'Cron expression for the schedule (e.g., "0 9 ? * * *" for 9 AM UTC daily) https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-scheduled-rule-pattern.html',
      required: true,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description:
        'Timezone for the schedule (e.g., "UTC", "America/New_York") Refer : https://data.iana.org/time-zones/tzdb-2021a/zone1970.tab',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'Output format for the schedule',
      options: {
        disabled: false,
        options: [
          { label: 'Link Only', value: 'link_only' },
          { label: 'PDF', value: 'pdf' },
          { label: 'PNG', value: 'png' },
          { label: 'CSV', value: 'csv' },
          { label: 'XLSX', value: 'xlsx' },
          { label: 'JSON', value: 'json' },
        ],
      },
      required: true,
    }),
    destinationType: Property.StaticDropdown({
      displayName: 'Destination Type',
      description: 'Type of destination for the schedule',
      options: {
        disabled: false,
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Webhook', value: 'webhook' },
          { label: 'SFTP', value: 'sftp' },
        ],
      },
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Webhook URL (required when destinationType is webhook)',
      required: false,
    }),
    recipients: Property.Array({
      displayName: 'Recipients',
      description: 'Email recipients (required when destinationType is email)',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Email Subject',
      description: 'Subject line for email delivery',
      required: false,
    }),
    paperFormat: Property.StaticDropdown({
      displayName: 'Paper Format',
      description: 'Paper format for PDF output',
      options: {
        disabled: false,
        options: [
          { label: 'Letter', value: 'letter' },
          { label: 'A4', value: 'a4' },
        ],
      },
      required: false,
    }),
    paperOrientation: Property.StaticDropdown({
      displayName: 'Paper Orientation',
      description: 'Paper orientation for PDF output',
      options: {
        disabled: false,
        options: [
          { label: 'Portrait', value: 'portrait' },
          { label: 'Landscape', value: 'landscape' },
        ],
      },
      required: false,
    }),
  },
  async run(context) {
    const {
      identifier,
      name,
      schedule,
      timezone,
      format,
      destinationType,
      url,
      recipients,
      subject,
      paperFormat,
      paperOrientation,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      identifier,
      name,
      schedule,
      timezone,
      format,
      destinationType,
    };

    if (url) {
      body['url'] = url;
    }

    if (recipients) {
      body['recipients'] = recipients;
    }

    if (subject) {
      body['subject'] = subject;
    }

    if (paperFormat) {
      body['paperFormat'] = paperFormat;
    }

    if (paperOrientation) {
      body['paperOrientation'] = paperOrientation;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/schedules',
      body
    );

    return response;
  },
});

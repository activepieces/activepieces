import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { coralogixAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const sendLogs = createAction({
  auth: coralogixAuth,
  name: 'sendLogs',
  displayName: 'Send Logs',
  description: 'Send a single log to Coralogix Log Ingestion API.',
  requireAuth: true,
  props: {
    text: Property.LongText({
      displayName: 'Log Message',
      description:
        'Raw log message text. Provide either this field or Log Message (JSON).',
      required: false,
    }),
    applicationName: Property.ShortText({
      displayName: 'Application Name',
      description: 'The application name for this log.',
      required: true,
      defaultValue: 'my-app',
    }),
    subsystemName: Property.ShortText({
      displayName: 'Subsystem Name',
      description: 'The subsystem name for this log.',
      required: true,
      defaultValue: 'auth-service',
    }),
    severity: Property.StaticDropdown({
      displayName: 'Severity',
      required: false,
      options: {
        options: [
          { label: 'Debug (1)', value: 1 },
          { label: 'Verbose (2)', value: 2 },
          { label: 'Info (3)', value: 3 },
          { label: 'Warn (4)', value: 4 },
          { label: 'Error (5)', value: 5 },
          { label: 'Critical (6)', value: 6 },
        ],
      },
    }),
    category: Property.ShortText({
      displayName: 'Category',
      required: false,
    }),
    className: Property.ShortText({
      displayName: 'Class Name',
      required: false,
    }),
    computerName: Property.ShortText({
      displayName: 'Computer Name',
      required: false,
    }),
    methodName: Property.ShortText({
      displayName: 'Method Name',
      required: false,
    }),
    threadId: Property.ShortText({
      displayName: 'Thread ID',
      required: false,
    }),
    timestamp: Property.Number({
      displayName: 'Timestamp',
      description:
        'UTC milliseconds since 1970. Leave empty to use ingestion time.',
      required: false,
    }),
    hiResTimestamp: Property.ShortText({
      displayName: 'High Resolution Timestamp',
      description:
        'UTC nanoseconds since 1970 as a string. Optional alternative to timestamp.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      text,
      applicationName,
      subsystemName,
      severity,
      category,
      className,
      computerName,
      methodName,
      threadId,
      timestamp,
      hiResTimestamp,
    } = propsValue;

    const logRecord: Record<string, unknown> = {
      applicationName,
      subsystemName,
    };

    logRecord['text'] =  text;

    if (severity !== undefined) logRecord['severity'] = Number(severity);
    if (category) logRecord['category'] = category;
    if (className) logRecord['className'] = className;
    if (computerName) logRecord['computerName'] = computerName;
    if (methodName) logRecord['methodName'] = methodName;
    if (threadId) logRecord['threadId'] = threadId;
    if (timestamp !== undefined) logRecord['timestamp'] = timestamp;
    if (hiResTimestamp) logRecord['hiResTimestamp'] = hiResTimestamp;

    const response = await makeRequest(
      auth,
      'ingestion',
      HttpMethod.POST,
      `/logs/v1/singles`,
      [logRecord]
    );

    return {
      success: true,
      sent: 1,
      response,
    };
  },
});

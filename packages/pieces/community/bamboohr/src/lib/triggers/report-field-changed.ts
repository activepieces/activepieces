import { bambooHrAuth } from '../../index';
import {
  DedupeStrategy,
  HttpMethod,
  HttpRequest,
  Polling,
  httpClient,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
  Property,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof bambooHrAuth>,
  {
    reportId: string;
    fieldToMonitor: string;
  }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, store }) => {
    const { companyDomain, apiKey } = auth.props;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.bamboohr.com/api/gateway.php/${companyDomain}/v1/reports/${propsValue.reportId}?format=json`,
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
        Accept: 'application/json',
      },
    };

    try {
      const response = await httpClient.sendRequest<{
        fields: Array<{ id: string; type: string; name: string }>;
        employees: Array<Record<string, any>>;
      }>(request);

      const fields = response.body.fields || [];
      const reportData = response.body.employees || [];

      const availableFields = new Set(fields.map((f) => f.id));

      if (!availableFields.has(propsValue.fieldToMonitor)) {
        console.warn(
          `Field "${
            propsValue.fieldToMonitor
          }" not found in report. Available fields: ${Array.from(
            availableFields
          ).join(', ')}`
        );
        return [];
      }

      const lastKnownState =
        (await store.get<Record<string, any>>('lastReportState')) || {};
      const currentState: Record<string, any> = {};
      const changes: any[] = [];

      reportData.forEach((employee: Record<string, any>) => {
        const employeeId = String(
          employee['id'] || employee['employeeId'] || 'unknown'
        );
        const currentFieldValue = employee[propsValue.fieldToMonitor];
        const lastFieldValue = lastKnownState[employeeId];

        currentState[employeeId] = currentFieldValue;

        if (
          lastFieldValue !== undefined &&
          lastFieldValue !== currentFieldValue
        ) {
          changes.push({
            epochMilliSeconds: dayjs().valueOf(),
            data: {
              employeeId,
              employeeName:
                employee['displayName'] ||
                (employee['firstName'] && employee['lastName']
                  ? `${employee['firstName']} ${employee['lastName']}`
                  : 'Unknown'),
              fieldName: propsValue.fieldToMonitor,
              oldValue: lastFieldValue,
              newValue: currentFieldValue,
              changedAt: dayjs().toISOString(),
              employee: employee,
            },
          });
        }
      });

      await store.put('lastReportState', currentState);
      return changes;
    } catch (error) {
      console.error('Error fetching BambooHR report:', error);
      return [];
    }
  },
};

export const reportFieldChanged = createTrigger({
  auth: bambooHrAuth,
  name: 'reportFieldChanged',
  displayName: 'Report Field Changed',
  description:
    'Triggers when a specific field in a BambooHR report changes for any employee.',
  props: {
    reportId: Property.ShortText({
      displayName: 'Report ID',
      description:
        'The ID of the BambooHR report to monitor (e.g., "1", "2", etc.)',
      required: true,
    }),
    fieldToMonitor: Property.ShortText({
      displayName: 'Field to Monitor',
      description:
        'The name of the field to watch for changes (e.g., "department", "jobTitle", "status")',
      required: true,
    }),
  },
  sampleData: {
    employeeId: '12345',
    employeeName: 'John Doe',
    fieldName: 'department',
    oldValue: 'Engineering',
    newValue: 'Product',
    changedAt: '2024-07-17T15:30:00Z',
    employee: {
      id: '12345',
      displayName: 'John Doe',
      department: 'Product',
      jobTitle: 'Senior Developer',
    },
  },
  type: TriggerStrategy.POLLING,

  async test(context) {
    return await pollingHelper.test(polling, context);
  },

  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});

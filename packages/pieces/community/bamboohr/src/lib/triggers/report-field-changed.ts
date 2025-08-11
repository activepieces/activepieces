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
  PiecePropValueSchema,
  TriggerStrategy,
  createTrigger,
  Property,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';

const polling: Polling<
  PiecePropValueSchema<typeof bambooHrAuth>,
  {
    reportId: string;
    fieldToMonitor: string;
  }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, store }) => {
    const { companyDomain, apiKey } = auth as {
      companyDomain: string;
      apiKey: string;
    };

    // Fetch the report from BambooHR
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.bamboohr.com/api/gateway.php/${companyDomain}/v1/reports/${propsValue.reportId}?format=json`,
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
        Accept: 'application/json',
      },
    };

    try {
      const response = await httpClient.sendRequest<{ employees: any[] }>(
        request
      );
      const reportData = response.body.employees || [];

      // Get the last known state from store
      const lastKnownState =
        (await store.get<Record<string, any>>('lastReportState')) || {};
      const currentState: Record<string, any> = {};
      const changes: any[] = [];

      // Process each employee record
      reportData.forEach((employee: any) => {
        const employeeId = employee.id || employee.employeeId;
        const currentFieldValue = employee[propsValue.fieldToMonitor];
        const lastFieldValue = lastKnownState[employeeId];

        // Store current state
        currentState[employeeId] = currentFieldValue;

        // Check for changes
        if (
          lastFieldValue !== undefined &&
          lastFieldValue !== currentFieldValue
        ) {
          changes.push({
            epochMilliSeconds: dayjs().valueOf(),
            data: {
              employeeId,
              employeeName:
                employee.displayName ||
                employee.firstName + ' ' + employee.lastName,
              fieldName: propsValue.fieldToMonitor,
              oldValue: lastFieldValue,
              newValue: currentFieldValue,
              changedAt: dayjs().toISOString(),
              employee: employee, // Include full employee data
            },
          });
        }
      });

      // Update stored state
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
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});

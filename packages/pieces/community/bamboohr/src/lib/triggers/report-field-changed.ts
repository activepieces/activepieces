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
        fields: Array<{id: string; type: string; name: string}>;
        employees: any[][];
      }>(request);
  
      const fields = response.body.fields || [];
      const reportData = response.body.employees || [];
  
      const fieldMap: Record<string, number> = {};
      fields.forEach((field, idx) => {
        fieldMap[field.id] = idx;
      });
  
      const monitorFieldIdx = fieldMap[propsValue.fieldToMonitor];
      const idFieldIdx = fieldMap['id'] || 0;
  
      if (monitorFieldIdx === undefined) {
        console.warn(
          `Field "${propsValue.fieldToMonitor}" not found in report. Available fields: ${Object.keys(fieldMap).join(', ')}`
        );
        return [];
      }
  
      const lastKnownState = (await store.get<Record<string, any>>('lastReportState')) || {};
      const currentState: Record<string, any> = {};
      const changes: any[] = [];
      const displayNameIdx =
        fieldMap['displayName'] ??
        fieldMap['fullName2'] ??
        fieldMap['firstName'] ??
        idFieldIdx;
  
      reportData.forEach((employee: any) => {
        const employeeId = String(employee[idFieldIdx]);
        const currentFieldValue = employee[monitorFieldIdx];
        const lastFieldValue = lastKnownState[employeeId];

        currentState[employeeId] = currentFieldValue;

        if (lastFieldValue !== undefined && lastFieldValue !== currentFieldValue) {
          changes.push({
            epochMilliSeconds: dayjs().valueOf(),
            data: {
              employeeId,
              employeeName: employee[displayNameIdx] || 'Unknown',
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
    return await pollingHelper.test(polling, context);  },

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
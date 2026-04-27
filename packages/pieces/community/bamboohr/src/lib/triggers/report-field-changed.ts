import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
  Property,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { bambooHrAuth } from '../common/auth';
import { isEmpty, isNil } from '@activepieces/shared';

async function getReportById(
  companyDomain: string,
  reportId: string,
  apiKey: string
) {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `https://api.bamboohr.com/api/gateway.php/${companyDomain}/v1/reports/${reportId}?format=json`,
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      Accept: 'application/json',
    },
  };

  const response = await httpClient.sendRequest<{
    fields: Array<{ id: string; type: string; name: string }>;
    employees: Array<Record<string, any>>;
  }>(request);

  return response;
}

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
    fieldToMonitor: Property.Dropdown({
      displayName: 'Field to Monitor',
      description:
        'The name of the field to watch for changes (e.g., "department", "jobTitle", "status")',
      required: true,
      auth: bambooHrAuth,
      refreshers: ['reportId'],
      options: async ({ auth, reportId }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }

        if (!reportId) {
          return {
            disabled: true,
            placeholder: 'Please provide report ID first.',
            options: [],
          };
        }

        const { companyDomain, apiKey } = auth.props;

        const response = await getReportById(
          companyDomain,
          reportId as string,
          apiKey
        );

        const fields = response.body.fields || [];

        return {
          disabled: false,
          options: fields.map((field) => ({
            label: field.name,
            value: field.name,
          })),
        };
      },
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
    const { reportId, fieldToMonitor } = context.propsValue;
    const { companyDomain, apiKey } = context.auth.props;

    const response = await getReportById(companyDomain, reportId, apiKey);

    const employees = response.body.employees || [];

    const fields = response.body.fields || [];

    const fieldMap = fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.name] = field.id;
      return acc;
    }, {});

    const fieldId = fieldMap[fieldToMonitor];

    if (isNil(fieldId)) {
      throw new Error('Incorrect Field Provided.');
    }

    const items = employees.slice(0, 10).map((employee) => {
      const employeeId = String(
        employee['id'] || employee['employeeId'] || 'unknown'
      );
      const currentFieldValue = employee[fieldId];
      return {
        employeeId,
        employeeName:
          employee['displayName'] ||
          (employee['firstName'] && employee['lastName']
            ? `${employee['firstName']} ${employee['lastName']}`
            : 'Unknown'),
        fieldName: fieldToMonitor,
        oldValue: currentFieldValue,
        newValue: currentFieldValue,
        changedAt: dayjs().toISOString(),
        employee: employee,
      };
    });

    return items;
  },

  async onEnable(context) {
    const { reportId, fieldToMonitor } = context.propsValue;
    const { companyDomain, apiKey } = context.auth.props;

    const response = await getReportById(companyDomain, reportId, apiKey);

    const employees = response.body.employees || [];

    const fields = response.body.fields || [];

    const fieldMap = fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.name] = field.id;
      return acc;
    }, {});

    const fieldId = fieldMap[fieldToMonitor];

    if (isNil(fieldId)) {
      throw new Error(`Field "${fieldToMonitor}" not found in report.`);
    }

    // Store all field values per employee (employee may appear multiple times due to duplicate records)
    const currentState: Record<string, string[]> = {};

    for (const employee of employees) {
      const employeeId = String(
        employee['id'] || employee['employeeId'] || 'unknown'
      );
      if (!currentState[employeeId]) currentState[employeeId] = [];
      currentState[employeeId].push(String(employee[fieldId] ?? ''));
    }

    await context.store.put('lastReportState', currentState);
  },

  async onDisable(context) {
    await context.store.delete('lastReportState');
  },

  async run(context) {
    const { reportId, fieldToMonitor } = context.propsValue;
    const { companyDomain, apiKey } = context.auth.props;

    const lastKnownState =
      (await context.store.get<Record<string, string[]>>('lastReportState')) ||
      {};

    try {
      const response = await getReportById(companyDomain, reportId, apiKey);

      const fields = response.body.fields || [];
      const reportData = response.body.employees || [];

      const fieldMap = fields.reduce<Record<string, string>>((acc, field) => {
        acc[field.name] = field.id;
        return acc;
      }, {});

      const fieldId = fieldMap[fieldToMonitor];

      const availableFields = new Set(fields.map((f) => f.name));

      if (!availableFields.has(fieldToMonitor)) {
        return [];
      }

      // Collect all field values per employee (employee may appear multiple times due to duplicate records)
      const currentState: Record<string, string[]> = {};
      const employeeMap: Record<string, Record<string, any>> = {};
      const changes: any[] = [];

      for (const employee of reportData) {
        const employeeId = String(
          employee['id'] || employee['employeeId'] || 'unknown'
        );
        if (!currentState[employeeId]) currentState[employeeId] = [];
        currentState[employeeId].push(String(employee[fieldId] ?? ''));
        employeeMap[employeeId] = employee;
      }

      for (const [employeeId, currentValues] of Object.entries(currentState)) {
        const lastValues = lastKnownState[employeeId];

        const employee = employeeMap[employeeId];
        const employeeName =
          employee['displayName'] ||
          (employee['firstName'] && employee['lastName']
            ? `${employee['firstName']} ${employee['lastName']}`
            : 'Unknown');

        // New record not seen in the previous poll — fire for each unique value
        if (isEmpty(lastValues)) {
          for (const newValue of new Set(currentValues)) {
            changes.push({
              employeeId,
              employeeName,
              fieldName: fieldToMonitor,
              oldValue: '',
              newValue,
              changedAt: dayjs().toISOString(),
              employee,
            });
          }
          continue;
        }

        const lastSet = new Set(lastValues);
        const currentSet = new Set(currentValues);
        // Values that appeared in current poll but weren't in the last poll
        const added = currentValues.filter((v) => !lastSet.has(v));
        // Values that were in the last poll but no longer present (used as oldValue context)
        const removed = lastValues.filter((v) => !currentSet.has(v));

        // Only trigger when a new value appeared
        if (added.length === 0) continue;

        // Fire one event per new value, paired with old value if available
        for (let i = 0; i < added.length; i++) {
          changes.push({
            employeeId,
            employeeName,
            fieldName: fieldToMonitor,
            oldValue: removed[i] ?? lastValues[lastValues.length - 1] ?? '',
            newValue: added[i],
            changedAt: dayjs().toISOString(),
            employee,
          });
        }
      }

      await context.store.put('lastReportState', currentState);
      return changes;
    } catch (error) {
      return [];
    }
  },
});

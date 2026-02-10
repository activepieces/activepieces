import { createAction, Property } from '@activepieces/pieces-framework';
import { mooninvoiceAuth } from '../common/auth';
import { getAccessToken, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { companyIdProp, projectIdProp } from '../common/props';

export const createTask = createAction({
  auth: mooninvoiceAuth,
  name: 'createTask',
  displayName: 'Create Task',
  description: 'Create a new task in MoonInvoice',
  props: {
    companyId: companyIdProp,
    taskName: Property.ShortText({
      displayName: 'Task Name',
      description: 'Name of Task',
      required: true,
    }),
    projectId: projectIdProp,
    hours: Property.Number({
      displayName: 'Hours',
      description: 'Task hours',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Task notes',
      required: false,
    }),
    rate: Property.Number({
      displayName: 'Rate',
      description: 'Rate of task',
      required: false,
    }),
    taskType: Property.ShortText({
      displayName: 'Task Type',
      description: 'Type of task like Hours, Minutes etc.',
      required: false,
    }),
    sacCode: Property.ShortText({
      displayName: 'SAC Code',
      description: 'SACCode of task',
      required: false,
    }),
    taskTaxJson: Property.LongText({
      displayName: 'Task Tax (JSON)',
      description:
        'Array of TaxID for task. Example: ["95A1956E-E60A-4FAC-8EC4-C88EE7431280", "CBC0A8DD-EDF5-47B2-B8DB-E7BA953E2C86"]',
      required: false,
    }),
  },
  async run(context) {
    const {
      companyId,
      taskName,
      projectId,
      hours,
      notes,
      rate,
      taskType,
      sacCode,
      taskTaxJson,
    } = context.propsValue;

    const body: any = {
      CompanyID: companyId,
      TaskName: taskName,
      ProjectID: projectId,
    };

    if (hours !== undefined && hours !== null) body.Hours = hours;
    if (notes) body.Notes = notes;
    if (rate !== undefined && rate !== null) body.Rate = rate;
    if (taskType) body.TaskType = taskType;
    if (sacCode) body.SACCode = sacCode;

    // Parse and add task tax
    if (taskTaxJson) {
      try {
        body.TaskTax = JSON.parse(taskTaxJson);
      } catch (error) {
        throw new Error('Invalid TaskTax JSON format');
      }
    }

    const accessToken = await getAccessToken(
      context.auth.props.email,
      context.auth.props.secret_text
    );

    const response = await makeRequest(
      accessToken,
      HttpMethod.POST,
      '/add_task',
      body
    );

    return response;
  },
});

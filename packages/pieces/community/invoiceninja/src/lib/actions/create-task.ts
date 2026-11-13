import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from '../common/auth';
import { invoiceNinjaClient } from '../common/client';
import { invoiceNinjaOutputSchemas } from '../common/output-schemas';
import { invoiceNinjaProps } from '../common/props';
import { invoiceNinjaTaskHelpers } from './ai/tasks-reports';

export const createTask = createAction({
  auth: invoiceninjaAuth,
  name: 'create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Creates a billable task in Invoice Ninja.',
  audience: 'human',
  outputSchema: invoiceNinjaOutputSchemas.legacyTaskCreated,
  props: {
    number: Property.ShortText({
      displayName: 'Task or Ticket Number',
      description: 'A task or ticket number not used before in Invoice Ninja.',
      required: true,
    }),
    client_id: invoiceNinjaProps.clientDropdown({ required: false }),
    project_id: invoiceNinjaProps.projectDropdown({ required: false }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'What the task is about.',
      required: true,
    }),
    rate: Property.Number({
      displayName: 'Custom Hourly Rate',
      description: 'Leave empty to use the default rate.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body = invoiceNinjaTaskHelpers.taskBody(propsValue);
    if (body['description'] === undefined) throw new Error('Description is required.');
    if (body['number'] === undefined) throw new Error('Task or Ticket Number is required.');
    return invoiceNinjaClient.envelopeOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.POST, path: '/tasks', body }),
    );
  },
});

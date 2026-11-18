import { createAction, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from '../common/auth';
import { invoiceNinjaClient } from '../common/client';
import { invoiceNinjaOutputSchemas } from '../common/output-schemas';

export const existsTask = createAction({
  auth: invoiceninjaAuth,
  name: 'exists_task',
  classification: 'READ',
  displayName: 'Check Task Existence',
  description: 'Returns 1 if a task with this number exists, 0 if not.',
  audience: 'human',
  outputSchema: invoiceNinjaOutputSchemas.taskExists,
  props: {
    number: Property.ShortText({
      displayName: 'Task or Ticket Number',
      description: 'The task or ticket number to check.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const number = invoiceNinjaClient.optionalText(propsValue.number);
    if (number === undefined) throw new Error('Task or Ticket Number is required.');
    const result = await invoiceNinjaClient.listPage({
      auth: auth.props,
      entity: 'tasks',
      query: { number, status: 'active,archived' },
      page: 1,
      perPage: 100,
    });
    const found = result.items.some((item) => invoiceNinjaClient.isRecord(item) && item['number'] === number);
    return found ? 1 : 0;
  },
});

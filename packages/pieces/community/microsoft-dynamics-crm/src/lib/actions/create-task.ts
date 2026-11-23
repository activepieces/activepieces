import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../auth';
import { dynamicsCommonInternals, makeClient } from '../common';
import { taskOutputSchema } from '../common/output-schemas';
import { dynamicsProps } from '../common/props';

export const createTaskAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Creates a task, optionally linked to a record (Regarding).',
  audience: 'human',
  aiMetadata: {
    description: 'Creates a Dynamics 365 task activity. Each call creates a new task.',
    idempotent: false,
  },
  props: {
    subject: Property.ShortText({ displayName: 'Subject', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false, advanced: true }),
    dueDate: Property.DateTime({ displayName: 'Due Date', required: false }),
    priority: Property.StaticDropdown<string>({
      displayName: 'Priority',
      required: false,
      defaultValue: '1',
      display: 'cards',
      options: {
        disabled: false,
        options: [
          { label: 'Low', value: '0' },
          { label: 'Normal', value: '1' },
          { label: 'High', value: '2' },
        ],
      },
    }),
    regardingEntity: dynamicsCommonInternals.tableDropdown({
      displayName: 'Regarding Table',
      description: 'Optional. The table of the record this task is about.',
      required: false,
      include: (entity) => entity.HasActivities === true,
    }),
    regardingRecordId: dynamicsProps.recordDropdown({
      displayName: 'Regarding Record',
      description: 'The record this task is about. Type to search by name, or map a record ID.',
      required: false,
      entitySetProp: 'regardingEntity',
    }),
  },
  outputSchema: taskOutputSchema,
  async run(context) {
    const { subject, description, dueDate, priority, regardingEntity, regardingRecordId } = context.propsValue;
    return await makeClient(context.auth).createTask({
      subject,
      description,
      dueDate: dynamicsProps.readString(dueDate),
      priority: readPriority(priority),
      regardingEntitySet: dynamicsProps.readString(regardingEntity),
      regardingId: dynamicsProps.readString(regardingRecordId),
    });
  },
});

function readPriority(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const text = String(value).trim().toLowerCase();
  const named = PRIORITY_CODES[text];
  if (named !== undefined) {
    return named;
  }
  const number = Number(text);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`Priority must be Low, Normal or High (0, 1 or 2). Received "${String(value).slice(0, 40)}".`);
  }
  return number;
}

const PRIORITY_CODES: Record<string, number> = { low: 0, normal: 1, high: 2 };

export const createTaskInternals = { readPriority };

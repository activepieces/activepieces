import { Property, createAction } from '@activepieces/pieces-framework';
import { dynamicsCRMAuth } from '../../auth';
import { makeClient } from '../../common/client';
import { taskOutputSchema } from '../../common/output-schemas';

export const aiCreateTaskAction = createAction({
  auth: dynamicsCRMAuth,
  name: 'ai_create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Creates a task, optionally about a record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a Dynamics 365 task activity, optionally regarding a record and assigned to a user (ownerId from Who Am I or a systemusers search). Not idempotent: each call creates a new task.',
    idempotent: false,
  },
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Task subject.',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Optional details.',
      required: false,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'Optional ISO 8601 date-time, for example 2026-12-31T17:00:00Z.',
      required: false,
    }),
    priority: Property.StaticDropdown<string>({
      displayName: 'Priority',
      required: false,
      defaultValue: 'normal',
      options: { disabled: false, options: [{ label: 'Low', value: 'low' }, { label: 'Normal', value: 'normal' }, { label: 'High', value: 'high' }] },
    }),
    regardingEntitySet: Property.ShortText({
      displayName: 'Regarding Entity Set',
      description: 'Optional entity set of the related record, for example accounts.',
      required: false,
    }),
    regardingRecordId: Property.ShortText({
      displayName: 'Regarding Record ID',
      description: 'Optional GUID of the related record.',
      required: false,
    }),
    ownerId: Property.ShortText({
      displayName: 'Owner User ID',
      description: 'Optional systemuser GUID to assign the task to.',
      required: false,
    }),
  },
  outputSchema: taskOutputSchema,
  async run(context) {
    const { subject, description, dueDate, priority, regardingEntitySet, regardingRecordId, ownerId } = context.propsValue;
    const due = dueDate?.trim() || undefined;
    if (due !== undefined && Number.isNaN(Date.parse(due))) {
      throw new Error('Due Date must be an ISO 8601 date-time, for example 2026-12-31T17:00:00Z.');
    }
    const priorities: Record<string, number> = { low: 0, normal: 1, high: 2 };
    const priorityCode = priority ? priorities[priority] : undefined;
    if (priority && priorityCode === undefined) {
      throw new Error('Priority must be low, normal or high.');
    }
    return await makeClient(context.auth).createTask({
      subject,
      description: description?.trim() || undefined,
      dueDate: due,
      priority: priorityCode,
      regardingEntitySet: regardingEntitySet?.trim() || undefined,
      regardingId: regardingRecordId?.trim() || undefined,
      ownerId: ownerId?.trim() || undefined,
    });
  },
});

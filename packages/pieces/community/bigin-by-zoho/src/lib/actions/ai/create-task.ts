import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../../auth';
import { biginAiProps } from '../../common/props';
import { getBiginConnection } from '../../common/request';
import { biginRecords } from '../../common/records';
import { biginOutputSchemas } from '../../common/output-schemas';
import { formatDateOnly } from '../../common/helpers';

export const biginCreateTaskAi = createAction({
  auth: biginAuth,
  name: 'bigin_create_task',
  classification: 'WRITE',
  displayName: 'Create Task (Agent)',
  description: 'Create a new task in Bigin.',
  audience: 'ai',
  outputSchema: biginOutputSchemas.aiCreateResult,
  aiMetadata: {
    description:
      'Creates a new task in Bigin, optionally linked to a contact, company or deal. Subject is required. Not idempotent: each call creates a new task. Returns the new id and the saved record.',
    idempotent: false,
  },
  props: {
    subject: biginAiProps.text({ displayName: 'Subject', description: 'Task subject.', required: true }),
    dueDate: biginAiProps.text({ displayName: 'Due Date', description: 'Due date (YYYY-MM-DD).', required: false }),
    status: Property.StaticDropdown({ displayName: 'Status', description: 'Task status.', required: false, options: { options: [{ label: 'Not Started', value: 'Not Started' }, { label: 'Deferred', value: 'Deferred' }, { label: 'In Progress', value: 'In Progress' }, { label: 'Completed', value: 'Completed' }, { label: 'Waiting on someone else', value: 'Waiting on someone else' }] } }),
    priority: Property.StaticDropdown({ displayName: 'Priority', description: 'Task priority.', required: false, options: { options: [{ label: 'High', value: 'High' }, { label: 'Highest', value: 'Highest' }, { label: 'Low', value: 'Low' }, { label: 'Lowest', value: 'Lowest' }, { label: 'Normal', value: 'Normal' }] } }),
    ownerId: biginAiProps.ownerId(),
    relatedModule: biginAiProps.relatedModule(),
    relatedId: biginAiProps.relatedId(),
    description: biginAiProps.longText({ displayName: 'Description', description: 'Task details.', required: false }),
    additionalFields: biginAiProps.additionalFields(),
  },
  async run(context) {
    const { propsValue } = context;
    if (Boolean(propsValue.relatedModule) !== Boolean(propsValue.relatedId)) {
      throw new Error('Related Module and Related Record ID must be set together.');
    }
    const record = biginRecords.mergeAdditionalFields({
      record: {
      Subject: propsValue.subject ?? undefined,
      Due_Date: propsValue.dueDate ? formatDateOnly(propsValue.dueDate) : undefined,
      Status: propsValue.status ?? undefined,
      Priority: propsValue.priority ?? undefined,
      Owner: biginRecords.lookup(propsValue.ownerId ?? undefined),
      Related_To: biginRecords.lookup(propsValue.relatedId ?? undefined),
      $related_module: propsValue.relatedId ? biginRecords.relatedModuleForApi(propsValue.relatedModule) : undefined,
      Description: propsValue.description ?? undefined,
      },
      additionalFields: propsValue.additionalFields,
    });
    return biginRecords.create({ connection: getBiginConnection(context.auth), module: 'Tasks', record });
  },
});

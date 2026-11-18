import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../../auth';
import { biginAiProps } from '../../common/props';
import { getBiginConnection } from '../../common/request';
import { biginRecords } from '../../common/records';
import { biginOutputSchemas } from '../../common/output-schemas';
import { formatDateOnly } from '../../common/helpers';

export const biginUpdateTaskAi = createAction({
  auth: biginAuth,
  name: 'bigin_update_task',
  classification: 'WRITE',
  displayName: 'Update Task (Agent)',
  description: 'Update an existing task in Bigin.',
  audience: 'ai',
  outputSchema: biginOutputSchemas.aiUpdateResult,
  aiMetadata: {
    description:
      'Updates an existing Bigin task by id; set Status to Completed to close it. Only the fields you provide are changed. Idempotent. Returns the saved record.',
    idempotent: true,
  },
  props: {
    recordId: biginAiProps.id({ displayName: 'Task ID', description: 'Task id. Resolve it with Search Records (Agent) or List Records (Agent) on Tasks.', required: true }),
    subject: biginAiProps.text({ displayName: 'Subject', description: 'Task subject.', required: false }),
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
    if (Object.keys(record).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    return biginRecords.update({ connection: getBiginConnection(context.auth), module: 'Tasks', id: propsValue.recordId.trim(), record });
  },
});

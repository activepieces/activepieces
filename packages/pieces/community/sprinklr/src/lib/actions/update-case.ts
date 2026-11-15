import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sprinklrAuth } from '../auth';
import { sprinklrCase } from '../common/case';
import { sprinklrCaseWrite } from '../common/case-write';
import { sprinklrClient } from '../common/client';
import { sprinklrEndpoints } from '../common/endpoints';

const ASSIGNEE_TYPE = 'USER';

function parseDueDate(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const text = sprinklrCaseWrite.cleanText(value);
  if (text === undefined) {
    return undefined;
  }
  const time = /^\d+$/.test(text) ? Number(text) : Date.parse(text);
  if (!Number.isFinite(time)) {
    throw new Error(`Due Date "${text}" is not a date. Pick a date and time, or give one like 2026-11-20T17:00:00Z.`);
  }
  return time;
}

function buildWorkflow(props: UpdateCaseInput): Record<string, unknown> | undefined {
  const assigneeId = sprinklrCaseWrite.cleanText(props.assignee_id);
  const result = sprinklrCaseWrite.compact({
    assignment: assigneeId === undefined ? undefined : { assigneeId, assigneeType: ASSIGNEE_TYPE },
    addedQueues: sprinklrCaseWrite.parseIdList({ value: props.add_queue_ids, field: 'Add Queue IDs' }),
    removedQueues: sprinklrCaseWrite.parseIdList({ value: props.remove_queue_ids, field: 'Remove Queue IDs' }),
    syncedSelectedCustomProperties: sprinklrCaseWrite.customFieldsAsLists(props.custom_fields),
  });
  return Object.keys(result).length > 0 ? result : undefined;
}

function buildBody(props: UpdateCaseInput): Record<string, unknown> {
  const body = sprinklrCaseWrite.compact({
    subject: sprinklrCaseWrite.cleanText(props.subject),
    description: sprinklrCaseWrite.cleanText(props.description),
    status: sprinklrCaseWrite.cleanText(props.status),
    priority: sprinklrCaseWrite.cleanText(props.priority),
    caseType: sprinklrCaseWrite.cleanText(props.case_type),
    dueDate: parseDueDate(props.due_date),
    summary: sprinklrCaseWrite.cleanText(props.summary),
    workflow: buildWorkflow(props),
  });
  if (Object.keys(body).length === 0) {
    throw new Error('Update Case has nothing to change. Fill in at least one field to update, such as Status or Subject.');
  }
  return body;
}

export const updateCaseAction = createAction({
  auth: sprinklrAuth,
  name: 'update_case',
  classification: 'WRITE',
  displayName: 'Update Case',
  description: 'Changes fields on an existing case.',
  audience: 'both',
  aiMetadata: {
    description:
      'Changes only the fields you fill in on an existing Sprinklr case, found by its case number, and returns the updated case; every other field stays as it is. Use Create Case for a new case and Add Comment to Case to add a note. Setting the same values again gives the same result, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: sprinklrCase.outputSchema,
  propertyGroups: [
    { key: 'case', display: 'section', label: 'Case', icon: 'inbox', props: ['case_number'] },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'sliders',
      props: ['subject', 'description', 'status', 'priority', 'case_type', 'due_date', 'summary'],
    },
  ],
  props: {
    case_number: sprinklrCaseWrite.caseNumberProp(),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The new subject. Leave empty to keep the current one.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The new description. Leave empty to keep the current one.',
      required: false,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: 'A status your Sprinklr account uses, like Closed.',
      placeholder: 'Closed',
      required: false,
    }),
    priority: Property.ShortText({
      displayName: 'Priority',
      description: 'A priority your Sprinklr account uses, like High.',
      placeholder: 'High',
      required: false,
    }),
    case_type: Property.ShortText({
      displayName: 'Case Type',
      description: 'A case type your Sprinklr account uses, like Complaint.',
      placeholder: 'Complaint',
      required: false,
    }),
    due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'When the case must be resolved by.',
      required: false,
    }),
    summary: Property.LongText({
      displayName: 'Summary',
      description: 'A short summary of the case.',
      required: false,
    }),
    assignee_id: Property.ShortText({
      displayName: 'Assignee ID',
      description: 'The Sprinklr user ID to assign the case to.',
      placeholder: '60000123',
      required: false,
      advanced: true,
    }),
    add_queue_ids: Property.Array({
      displayName: 'Add Queue IDs',
      description: 'IDs of work queues to add the case to.',
      required: false,
      advanced: true,
    }),
    remove_queue_ids: Property.Array({
      displayName: 'Remove Queue IDs',
      description: 'IDs of work queues to take the case out of.',
      required: false,
      advanced: true,
    }),
    custom_fields: Property.Object({
      displayName: 'Custom Fields to Set',
      description: 'Only these fields change; other custom fields are kept.',
      required: false,
      advanced: true,
    }),
  },
  async run(context) {
    const caseNumber = sprinklrCaseWrite.parseCaseNumber(context.propsValue.case_number);
    const { subject, description, status, priority, case_type, due_date, summary, assignee_id, custom_fields, add_queue_ids, remove_queue_ids } =
      context.propsValue;
    const body = buildBody({
      subject,
      description,
      status,
      priority,
      case_type,
      due_date,
      summary,
      assignee_id,
      custom_fields,
      add_queue_ids: add_queue_ids?.length ? add_queue_ids : undefined,
      remove_queue_ids: remove_queue_ids?.length ? remove_queue_ids : undefined,
    });
    await sprinklrClient.request({
      auth: context.auth,
      method: HttpMethod.PATCH,
      path: sprinklrEndpoints.CASE,
      query: { caseNumber },
      body,
    });
    return sprinklrCase.getByNumber({ auth: context.auth, caseNumber });
  },
});

type UpdateCaseInput = {
  subject?: unknown;
  description?: unknown;
  status?: unknown;
  priority?: unknown;
  case_type?: unknown;
  due_date?: unknown;
  summary?: unknown;
  assignee_id?: unknown;
  add_queue_ids?: unknown[] | string | null;
  remove_queue_ids?: unknown[] | string | null;
  custom_fields?: unknown;
};

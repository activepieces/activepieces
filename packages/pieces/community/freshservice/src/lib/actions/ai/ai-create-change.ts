import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import { compactBody, freshserviceApiCall, pickFields } from '../../common/client';
import { freshserviceSchemas } from '../../common/schemas';

const CHANGE_FIELDS = ['subject', 'description', 'requester_id', 'agent_id', 'group_id', 'department_id', 'status', 'priority', 'impact', 'risk', 'change_type', 'planned_start_date', 'planned_end_date', 'category', 'sub_category', 'item_category', 'custom_fields'];

export const aiCreateChange = createAction({
  auth: freshserviceAuth,
  name: 'ai_create_change',
  displayName: 'Create Change (AI)',
  description: 'Creates a change request in Freshservice.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: freshserviceSchemas.change,
  aiMetadata: {
    description:
      'Creates a Freshservice change request. Requires a subject, description, numeric requester_id (from Find Requester) and ISO 8601 planned_start_date and planned_end_date (end after start). Status, priority, impact, risk and change type default to 1 when not given. Agent, group and department ids come from List Agents, List Groups and List Departments. Not idempotent — every call creates a new change.',
    idempotent: false,
  },
  props: {
    subject: Property.ShortText({ displayName: 'Subject', required: true }),
    description: Property.LongText({ displayName: 'Description', description: 'HTML is allowed.', required: true }),
    requester_id: Property.Number({ displayName: 'Requester ID', required: true }),
    agent_id: Property.Number({ displayName: 'Agent ID', required: false }),
    group_id: Property.Number({ displayName: 'Group ID', required: false }),
    department_id: Property.Number({ displayName: 'Department ID', required: false }),
    status: Property.Number({ displayName: 'Status', description: '1 Open, 2 Planning, 3 Approval, 4 Pending Release, 5 Pending Review, 6 Closed.', required: false }),
    priority: Property.Number({ displayName: 'Priority', description: '1 Low, 2 Medium, 3 High, 4 Urgent.', required: false }),
    impact: Property.Number({ displayName: 'Impact', description: '1 Low, 2 Medium, 3 High.', required: false }),
    risk: Property.Number({ displayName: 'Risk', description: '1 Low, 2 Medium, 3 High, 4 Very High.', required: false }),
    change_type: Property.Number({ displayName: 'Change Type', description: '1 Minor, 2 Standard, 3 Major, 4 Emergency.', required: false }),
    planned_start_date: Property.ShortText({ displayName: 'Planned Start', description: 'ISO 8601 date-time.', required: true }),
    planned_end_date: Property.ShortText({ displayName: 'Planned End', description: 'ISO 8601 date-time.', required: true }),
    category: Property.ShortText({ displayName: 'Category', required: false }),
    sub_category: Property.ShortText({ displayName: 'Sub Category', required: false }),
    item_category: Property.ShortText({ displayName: 'Item Category', required: false }),
    custom_fields: Property.Json({ displayName: 'Custom Fields', required: false }),
  },
  async run(context) {
    const props = context.propsValue;
    if (!props.planned_start_date?.trim() || !props.planned_end_date?.trim()) {
      throw new Error('Freshservice requires both planned_start_date and planned_end_date (ISO 8601) to create a change.');
    }
    const response = await freshserviceApiCall<{ change: Record<string, unknown> }>({
      method: HttpMethod.POST,
      endpoint: 'changes',
      auth: context.auth,
      body: compactBody({
        ...pickFields({ source: props, keys: CHANGE_FIELDS }),
        status: props.status ?? 1,
        priority: props.priority ?? 1,
        impact: props.impact ?? 1,
        risk: props.risk ?? 1,
        change_type: props.change_type ?? 1,
      }),
    });
    return response.body.change;
  },
});

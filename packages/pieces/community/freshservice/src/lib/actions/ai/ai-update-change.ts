import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import { freshserviceApiCall, pickFields } from '../../common/client';
import { freshserviceSchemas } from '../../common/schemas';

export const aiUpdateChange = createAction({
  auth: freshserviceAuth,
  name: 'ai_update_change',
  displayName: 'Update Change (AI)',
  description: 'Updates fields on a Freshservice change request.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: freshserviceSchemas.change,
  aiMetadata: {
    description:
      'Updates a Freshservice change request by numeric change id (from List Changes). Only the fields you pass are changed. Idempotent — sending the same values again leaves the change unchanged.',
    idempotent: true,
  },
  props: {
    change_id: Property.Number({ displayName: 'Change ID', required: true }),
    subject: Property.ShortText({ displayName: 'Subject', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    requester_id: Property.Number({ displayName: 'Requester ID', required: false }),
    agent_id: Property.Number({ displayName: 'Agent ID', required: false }),
    group_id: Property.Number({ displayName: 'Group ID', required: false }),
    department_id: Property.Number({ displayName: 'Department ID', required: false }),
    status: Property.Number({ displayName: 'Status', description: '1 Open, 2 Planning, 3 Approval, 4 Pending Release, 5 Pending Review, 6 Closed.', required: false }),
    priority: Property.Number({ displayName: 'Priority', description: '1 Low, 2 Medium, 3 High, 4 Urgent.', required: false }),
    impact: Property.Number({ displayName: 'Impact', description: '1 Low, 2 Medium, 3 High.', required: false }),
    risk: Property.Number({ displayName: 'Risk', description: '1 Low, 2 Medium, 3 High, 4 Very High.', required: false }),
    change_type: Property.Number({ displayName: 'Change Type', description: '1 Minor, 2 Standard, 3 Major, 4 Emergency.', required: false }),
    planned_start_date: Property.ShortText({ displayName: 'Planned Start', description: 'ISO 8601 date-time.', required: false }),
    planned_end_date: Property.ShortText({ displayName: 'Planned End', description: 'ISO 8601 date-time.', required: false }),
    category: Property.ShortText({ displayName: 'Category', required: false }),
    sub_category: Property.ShortText({ displayName: 'Sub Category', required: false }),
    item_category: Property.ShortText({ displayName: 'Item Category', required: false }),
    custom_fields: Property.Json({ displayName: 'Custom Fields', required: false }),
  },
  async run(context) {
    const { change_id } = context.propsValue;
    const body = pickFields({ source: context.propsValue, keys: CHANGE_FIELDS });
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const response = await freshserviceApiCall<{ change: Record<string, unknown> }>({
      method: HttpMethod.PUT,
      endpoint: `changes/${change_id}`,
      auth: context.auth,
      body,
    });
    return response.body.change;
  },
});

const CHANGE_FIELDS = ['subject', 'description', 'requester_id', 'agent_id', 'group_id', 'department_id', 'status', 'priority', 'impact', 'risk', 'change_type', 'planned_start_date', 'planned_end_date', 'category', 'sub_category', 'item_category', 'custom_fields'];

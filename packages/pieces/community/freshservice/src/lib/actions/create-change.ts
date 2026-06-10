import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';
import { freshserviceCommon } from '../common/props';

export const createChange = createAction({
  auth: freshserviceAuth,
  name: 'create_change',
  displayName: 'Create Change',
  description: 'Creates a new change request in Freshservice.',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the change.',
      required: true,
    }),
    requester_id: freshserviceCommon.requester(true),
    description: Property.LongText({
      displayName: 'Description',
      description: 'HTML content describing the change.',
      required: false,
    }),
    agent_id: freshserviceCommon.agent(false),
    group_id: freshserviceCommon.group(false),
    department_id: freshserviceCommon.department(false),
    priority: freshserviceCommon.priority,
    impact: freshserviceCommon.impact,
    status: freshserviceCommon.changeStatus,
    risk: freshserviceCommon.changeRisk,
    change_type: freshserviceCommon.changeType,
    planned_start_date: Property.ShortText({
      displayName: 'Planned Start Date',
      description: 'Planned start date and time (ISO 8601, e.g. 2025-01-15T09:00:00Z).',
      required: false,
    }),
    planned_end_date: Property.ShortText({
      displayName: 'Planned End Date',
      description: 'Planned end date and time (ISO 8601, e.g. 2025-01-15T17:00:00Z).',
      required: false,
    }),
    category: Property.ShortText({
      displayName: 'Category',
      description: 'Category of the change.',
      required: false,
    }),
    sub_category: Property.ShortText({
      displayName: 'Sub Category',
      description: 'Sub-category of the change.',
      required: false,
    }),
    item_category: Property.ShortText({
      displayName: 'Item Category',
      description: 'Item category of the change.',
      required: false,
    }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description: 'A JSON object of custom field names and values.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;

    const body: Record<string, unknown> = {
      subject: props.subject,
      requester_id: props.requester_id,
    };

    if (props.description) body['description'] = props.description;
    if (props.agent_id) body['agent_id'] = props.agent_id;
    if (props.group_id) body['group_id'] = props.group_id;
    if (props.department_id) body['department_id'] = props.department_id;
    if (props.priority) body['priority'] = props.priority;
    if (props.impact) body['impact'] = props.impact;
    if (props.status) body['status'] = props.status;
    if (props.risk) body['risk'] = props.risk;
    if (props.change_type) body['change_type'] = props.change_type;
    if (props.planned_start_date) body['planned_start_date'] = props.planned_start_date;
    if (props.planned_end_date) body['planned_end_date'] = props.planned_end_date;
    if (props.category) body['category'] = props.category;
    if (props.sub_category) body['sub_category'] = props.sub_category;
    if (props.item_category) body['item_category'] = props.item_category;
    if (props.custom_fields) body['custom_fields'] = props.custom_fields;

    const response = await freshserviceApiCall<{ change: Record<string, unknown> }>({
      method: HttpMethod.POST,
      endpoint: 'changes',
      auth: context.auth,
      body,
    });

    return response.body.change;
  },
});

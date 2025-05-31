import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { kommoAuth } from '../../index';
import { pipelineDropdown, statusDropdown, userDropdown, lossReasonDropdown } from '../common/props';

export const createLeadAction = createAction({
  auth: kommoAuth,
  name: 'create_lead',
  displayName: 'Create New Lead',
  description: 'Add a new sales lead.',
  props: {
    name: Property.ShortText({
      displayName: 'Lead Name',
      required: true,
    }),
    price: Property.Number({
      displayName: 'Price',
      required: false,
    }),
    pipeline_id: pipelineDropdown,
    status_id: statusDropdown,
    responsible_user_id: userDropdown,
    loss_reason_id: lossReasonDropdown,
    created_by: Property.Number({
      displayName: 'Created By (User ID)',
      required: false,
    }),
    updated_by: Property.Number({
      displayName: 'Updated By (User ID)',
      required: false,
    }),
    created_at: Property.Number({
      displayName: 'Created At (Unix Timestamp)',
      required: false,
    }),
    updated_at: Property.Number({
      displayName: 'Updated At (Unix Timestamp)',
      required: false,
    }),
    closed_at: Property.Number({
      displayName: 'Closed At (Unix Timestamp)',
      required: false,
    }),
    custom_fields_values: Property.Json({
      displayName: 'Custom Field Values',
      description: 'Array of custom field values',
      required: false,
    }),
    tags_to_add: Property.Array({
      displayName: 'Tags to Add',
      description: 'List of tags to add (objects with name or ID)',
      required: false,
    }),
    tags_to_delete: Property.Array({
      displayName: 'Tags to Delete',
      description: 'List of tags to delete (objects with name or ID)',
      required: false,
    }),
  },
  async run(context) {
    const {
      name,
      price,
      status_id,
      pipeline_id,
      created_by,
      updated_by,
      created_at,
      updated_at,
      closed_at,
      loss_reason_id,
      responsible_user_id,
      custom_fields_values,
      tags_to_add,
      tags_to_delete,
    } = context.propsValue;

    const { apiToken, subdomain } = context.auth;

    const body: Record<string, unknown> = {
      name,
    };

    if (price !== undefined) body['price'] = price;
    if (status_id !== undefined) body['status_id'] = status_id;
    if (pipeline_id !== undefined) body['pipeline_id'] = pipeline_id;
    if (created_by !== undefined) body['created_by'] = created_by;
    if (updated_by !== undefined) body['updated_by'] = updated_by;
    if (created_at !== undefined) body['created_at'] = created_at;
    if (updated_at !== undefined) body['updated_at'] = updated_at;
    if (closed_at !== undefined) body['closed_at'] = closed_at;
    if (loss_reason_id !== undefined) body['loss_reason_id'] = loss_reason_id;
    if (responsible_user_id !== undefined) body['responsible_user_id'] = responsible_user_id;
    if (custom_fields_values !== undefined) body['custom_fields_values'] = custom_fields_values;

    if (tags_to_add || tags_to_delete) {
      body['_embedded'] = {
        ...(tags_to_add ? { tags_to_add } : {}),
        ...(tags_to_delete ? { tags_to_delete } : {}),
      };
    }

    const response = await makeRequest(
      { apiToken, subdomain },
      HttpMethod.POST,
      '/leads',
      [body]
    );

    return response;
  },
});

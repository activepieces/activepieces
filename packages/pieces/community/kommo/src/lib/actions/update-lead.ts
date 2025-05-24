import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { kommoAuth } from '../../index';

interface KommoCustomFieldValue {
  field_id?: number;
  field_code?: string;
  values: Array<{ value: string | number; enum_id?: number }>;
}

export const updateLeadAction = createAction({
  auth: kommoAuth,
  name: 'update_lead',
  displayName: 'Update Lead',
  description: 'Update existing lead info.',
  props: {
    leadId: Property.Number({
      displayName: 'Lead ID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    price: Property.Number({
      displayName: 'Price',
      required: false,
    }),
    status_id: Property.Number({
      displayName: 'Status ID',
      required: false,
    }),
    pipeline_id: Property.Number({
      displayName: 'Pipeline ID',
      required: false,
    }),
    responsible_user_id: Property.Number({
      displayName: 'Responsible User ID',
      required: false,
    }),
    created_by: Property.Number({
      displayName: 'Created By',
      required: false,
    }),
    updated_by: Property.Number({
      displayName: 'Updated By',
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
    loss_reason_id: Property.Number({
      displayName: 'Loss Reason ID',
      required: false,
    }),
    custom_fields_values: Property.Json({
      displayName: 'Custom Fields Values',
      description: 'JSON array of custom field values.',
      required: false,
    }),
    tags_to_add: Property.Array({
      displayName: 'Tags to Add',
      required: false,
    }),
    tags_to_delete: Property.Array({
      displayName: 'Tags to Delete',
      required: false,
    }),
    request_id: Property.ShortText({
      displayName: 'Request ID',
      required: false,
    }),
  },
  async run(context) {
    const {
      leadId,
      name,
      price,
      status_id,
      pipeline_id,
      responsible_user_id,
      created_by,
      updated_by,
      created_at,
      updated_at,
      closed_at,
      loss_reason_id,
      custom_fields_values,
      tags_to_add,
      tags_to_delete,
      request_id,
    } = context.propsValue;

    const { subdomain, apiToken } = context.auth as {
      subdomain: string;
      apiToken: string;
    };

    const customFields: KommoCustomFieldValue[] = [];

    if (Array.isArray(custom_fields_values)) {
      customFields.push(...(custom_fields_values as KommoCustomFieldValue[]));
    }

    const embedded: Record<string, unknown> = {};

    if (tags_to_add && tags_to_add.length > 0) {
      embedded['tags_to_add'] = tags_to_add.map((tag) =>
        typeof tag === 'number' ? { id: tag } : { name: tag }
      );
    }

    if (tags_to_delete && tags_to_delete.length > 0) {
      embedded['tags_to_delete'] = tags_to_delete.map((tag) =>
        typeof tag === 'number' ? { id: tag } : { name: tag }
      );
    }

    if (request_id) {
      embedded['request_id'] = request_id;
    }

    const updatePayload = {
      name,
      price,
      status_id,
      pipeline_id,
      responsible_user_id,
      created_by,
      updated_by,
      created_at,
      updated_at,
      closed_at,
      loss_reason_id,
      ...(customFields.length > 0 ? { custom_fields_values: customFields } : {}),
      _embedded: Object.keys(embedded).length > 0 ? embedded : undefined,
    };

    const result = await makeRequest(
      { apiToken, subdomain },
      HttpMethod.PATCH,
      `/leads/${leadId}`,
      updatePayload
    );

    return result;
  },
});

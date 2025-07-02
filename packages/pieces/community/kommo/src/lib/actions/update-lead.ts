import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { kommoAuth } from '../../index';
import { pipelineDropdown, statusDropdown, userDropdown, lossReasonDropdown, leadDropdown } from '../common/props';

export const updateLeadAction = createAction({
  auth: kommoAuth,
  name: 'update_lead',
  displayName: 'Update Lead',
  description: 'Update existing lead info.',
  props: {
    leadId: leadDropdown,
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    price: Property.Number({
      displayName: 'Price',
      required: false,
    }),
    pipelineId: pipelineDropdown(false),
    statusId: statusDropdown(false),
    responsible_user_id: userDropdown(false),
    loss_reason_id: lossReasonDropdown(false),
    tags_to_add: Property.Array({
      displayName: 'Tags to Add',
      required: false,
    }),
    tags_to_delete: Property.Array({
      displayName: 'Tags to Delete',
      required: false,
    }),
  },
  async run(context) {
    const {
      leadId,
      name,
      price,
      statusId,
      pipelineId,
      responsible_user_id,
      loss_reason_id,
    } = context.propsValue;

    const tagsToAdd = context.propsValue.tags_to_add ?? [];
    const tagsToDelete = context.propsValue.tags_to_delete ?? [];


    const { subdomain, apiToken } = context.auth;

    const updatePayload: Record<string, any> = {};

    if (name) updatePayload['name'] = name;
    if (price) updatePayload['price'] = price;
    if (statusId) updatePayload['status_id'] = statusId;
    if (pipelineId) updatePayload['pipeline_id'] = pipelineId;
    if (loss_reason_id) updatePayload['loss_reason_id'] = loss_reason_id;
    if (responsible_user_id) updatePayload['responsible_user_id'] = responsible_user_id;

    if (tagsToAdd.length > 0) {
      updatePayload['tags_to_add'] = tagsToAdd.map((tag) => ({ name: tag }))
    }

    if (tagsToDelete.length > 0) {
      updatePayload['tags_to_delete'] = tagsToDelete.map((tag) => ({ name: tag }))
    }

    const result = await makeRequest(
      { apiToken, subdomain },
      HttpMethod.PATCH,
      `/leads/${leadId}`,
      updatePayload
    );

    return result;
  },
});

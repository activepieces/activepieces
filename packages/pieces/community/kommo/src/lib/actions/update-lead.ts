import { createAction, isNil, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { kommoAuth } from '../auth';
import { pipelineDropdown, statusDropdown, userDropdown, lossReasonDropdown, leadDropdown } from '../common/props';

export const updateLeadAction = createAction({
  auth: kommoAuth,
  name: 'update_lead',
  classification: 'WRITE',
  displayName: 'Update Lead',
  description: 'Updates an existing lead.',
  audience: 'both',
  aiMetadata: { description: 'Updates an existing Kommo CRM lead (deal) identified by lead ID, changing only the supplied fields (name, price, pipeline/status, responsible user, loss reason) and adding or removing tags. Use to move a lead through its pipeline or amend its details; resolve the lead ID first via Find Lead if unknown. Idempotent — repeating the same update yields the same lead state.', idempotent: true },
  props: {
    leadId: leadDropdown,
    changes_info: Property.MarkDown({
      value: 'Fields left empty keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    name: Property.ShortText({
      displayName: 'Lead Name',
      placeholder: 'Website redesign for Acme',
      required: false,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: "Deal value, in your account's currency.",
      required: false,
    }),
    responsible_user_id: userDropdown(false),
    pipelineId: { ...pipelineDropdown(false), width: 'half' },
    statusId: { ...statusDropdown(false), width: 'half' },
    tags_to_add: Property.Array({
      displayName: 'Tags to Add',
      description: 'Tag names to add to the lead.',
      required: false,
    }),
    tags_to_delete: Property.Array({
      displayName: 'Tags to Remove',
      description: 'Tag names to remove from the lead.',
      required: false,
    }),
    loss_reason_id: lossReasonDropdown({ required: false, advanced: true }),
  },
  propertyGroups: [
    {
      key: 'lead',
      display: 'section',
      label: 'Lead to Update',
      icon: 'text',
      props: ['leadId', 'changes_info'],
    },
    {
      key: 'details',
      display: 'section',
      label: 'Details',
      icon: 'text',
      props: ['name', 'price', 'responsible_user_id'],
    },
    {
      key: 'pipeline',
      display: 'section',
      label: 'Pipeline',
      icon: 'sliders',
      props: ['pipelineId', 'statusId'],
    },
    {
      key: 'tags',
      display: 'section',
      label: 'Tags',
      icon: 'tag',
      props: ['tags_to_add', 'tags_to_delete'],
    },
  ],
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


    const { subdomain, apiToken } = context.auth.props;

    const updatePayload: Record<string, any> = {};

    if (name) updatePayload['name'] = name;
    if (!isNil(price)) updatePayload['price'] = price;
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

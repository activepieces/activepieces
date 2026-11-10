import { Property, createAction } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { flowluCommon, makeClient } from '../../common';
import { flowluLinks } from '../../common/links';
import { flowluOpportunity } from '../../common/opportunity';
import { flowluProps, flowluWire } from '../../common/props';
import { flowluInput } from '../../common/utils';
import { opportunityEnvelopeOutputSchema } from '../../output-schemas';

export const updateOpportunityAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_update_opportunity',
  classification: 'WRITE',
  displayName: 'Update Opportunity',
  description: 'Updates an existing opportunity.',
  audience: 'human',
  aiMetadata: {
    description:
      "Updates fields on an existing sales opportunity (deal) in Flowlu CRM, identified by its opportunity id. Use to change a deal's title, pipeline stage, linked account, or other details, or to mark it won or lost. Only filled fields are sent; a stage without a pipeline is checked against the deal's current pipeline. Idempotent: repeating the same update leaves the deal unchanged, and repeating Won or Lost keeps the existing close date. For agents use flowlu_opportunity_update.",
    idempotent: true,
  },
  props: {
    id: flowluCommon.opportunity_id(true),
    name: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    ...flowluProps.opportunity,
    status: Property.StaticDropdown({
      displayName: 'Status',
      description:
        'Set to Won or Lost to close the opportunity, or In progress to reopen it. Moving it to Won or Lost sets the close date to today; an opportunity that already has that status keeps its close date. Leave empty to keep the current status.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'In progress', value: 1 },
          { label: 'Lost', value: 2 },
          { label: 'Won', value: 3 },
        ],
      },
    }),
    closing_status_id: flowluCommon.loss_reason_id(false),
    closing_comment: Property.LongText({
      displayName: 'Closing Comment',
      description: 'Note about why the opportunity was won or lost.',
      required: false,
    }),
  },
  outputSchema: opportunityEnvelopeOutputSchema,
  async run(context) {
    const { id: rawId, status: rawStatus, ...props } = context.propsValue;
    const id = flowluInput.requireId({ value: rawId, name: 'Opportunity ID' });
    const status = flowluInput.oneOf({
      value: rawStatus,
      name: 'Status',
      allowed: [1, 2, 3],
    });
    const customerId = flowluInput.optionalId({
      value: props.customer_id,
      name: 'Customer ID',
    });
    const contactId = flowluInput.optionalId({
      value: props.contact_id,
      name: 'Contact ID',
    });
    const fields = {
      ...flowluWire.fieldsOnly(props),
      start_date: flowluInput.formatDate({
        value: props.start_date,
        name: 'Start Date',
      }),
      deadline: flowluInput.formatDate({
        value: props.deadline,
        name: 'End Date',
      }),
      active: status,
    };
    const client = makeClient(context.auth);
    const derived = await flowluOpportunity.stageAndCloseFields({
      client,
      opportunityId: id,
      pipelineId: flowluInput.optionalId({
        value: props.pipeline_id,
        name: 'Sales Pipeline ID',
      }),
      stageId: flowluInput.optionalId({
        value: props.pipeline_stage_id,
        name: 'Sales Pipeline Stage ID',
      }),
      status,
      closingDate: undefined,
    });
    const res = await client.updateOpportunity(id, { ...fields, ...derived });
    const links = await flowluLinks.linkLegacyCustomer({
      client,
      leadId: id,
      customerId,
      contactId,
    });
    return links === undefined ? res : { ...res, ...links };
  },
});

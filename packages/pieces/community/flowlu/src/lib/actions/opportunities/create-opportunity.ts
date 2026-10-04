import { Property, createAction } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluLinks } from '../../common/links';
import { flowluOpportunity } from '../../common/opportunity';
import { flowluProps, flowluWire } from '../../common/props';
import { flowluInput } from '../../common/utils';
import { opportunityEnvelopeOutputSchema } from '../../output-schemas';

export const createOpportunityAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_create_opportunity',
  classification: 'WRITE',
  displayName: 'Create Opportunity',
  description: 'Creates a new opportunity.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new sales opportunity (deal) in Flowlu CRM, requiring a title. Use to open a new deal, optionally linking it to an account, sales pipeline, and stage. Not idempotent — each call creates a new opportunity record. For agents use flowlu_opportunity_create.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    ...flowluProps.opportunity,
  },
  outputSchema: opportunityEnvelopeOutputSchema,
  async run(context) {
    const props = context.propsValue;
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
    };
    const client = makeClient(context.auth);
    const stage = await flowluOpportunity.stageAndCloseFields({
      client,
      opportunityId: undefined,
      pipelineId: flowluInput.optionalId({
        value: props.pipeline_id,
        name: 'Sales Pipeline ID',
      }),
      stageId: flowluInput.optionalId({
        value: props.pipeline_stage_id,
        name: 'Sales Pipeline Stage ID',
      }),
      status: undefined,
      closingDate: undefined,
    });
    const res = await client.createOpportunity({
      ...fields,
      pipeline_id: stage.pipeline_id,
      pipeline_stage_id: stage.pipeline_stage_id,
    });
    if (customerId === undefined && contactId === undefined) {
      return res;
    }
    const links = await flowluLinks.linkLegacyCustomer({
      client,
      leadId: flowluInput.requireId({
        value: res.response?.['id'],
        name: 'Created opportunity id',
      }),
      customerId,
      contactId,
    });
    return links === undefined ? res : { ...res, ...links };
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluAiBody, flowluAiProps } from '../../common/ai-props';
import { flowluLinks } from '../../common/links';
import { flowluOpportunity } from '../../common/opportunity';
import { flowluInput, flowluOutput } from '../../common/utils';
import { opportunityCreateOutputSchema } from '../../output-schemas';

export const flowluOpportunityCreate = createAction({
  auth: flowluAuth,
  name: 'flowlu_opportunity_create',
  classification: 'WRITE',
  displayName: 'Create Opportunity',
  description: 'Creates a CRM opportunity (deal) in Flowlu.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one Flowlu sales opportunity (deal) with a name and optional amount, pipeline and stage, source, assignee, dates and free-text contact fields, then links it to a CRM organization and/or contact when organization_id or contact_id is given. Link failures are reported in link_errors without failing the step. Not idempotent: each call creates a new opportunity.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Opportunity name, such as "Website redesign for Acme".',
      required: true,
    }),
    ...flowluAiProps.opportunity(),
    organization_id: Property.ShortText({
      displayName: 'Organization ID',
      description:
        'CRM organization to link to the opportunity. Numeric ID from flowlu_find_accounts.',
      required: false,
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description:
        'CRM contact to link to the opportunity. Numeric ID from flowlu_find_accounts.',
      required: false,
    }),
  },
  outputSchema: opportunityCreateOutputSchema,
  async run(context) {
    const body = flowluAiBody.opportunity(context.propsValue);
    const organizationId = flowluInput.optionalId({
      value: context.propsValue.organization_id,
      name: 'Organization ID',
    });
    const contactId = flowluInput.optionalId({
      value: context.propsValue.contact_id,
      name: 'Contact ID',
    });
    const client = makeClient(context.auth);
    const stage = await flowluOpportunity.stageAndCloseFields({
      client,
      opportunityId: undefined,
      pipelineId: flowluInput.optionalId({
        value: context.propsValue.pipeline_id,
        name: 'Pipeline ID',
      }),
      stageId: flowluInput.optionalId({
        value: context.propsValue.pipeline_stage_id,
        name: 'Pipeline Stage ID',
      }),
      status: undefined,
      closingDate: undefined,
    });
    const created = await client.createRecord(
      'crm',
      'lead',
      flowluInput.compact({
        ...body,
        pipeline_id: stage.pipeline_id,
        pipeline_stage_id: stage.pipeline_stage_id,
      })
    );
    const leadId = flowluInput.requireId({
      value: created['id'],
      name: 'Created opportunity id',
    });
    const links: { accountId: number; accountType: 1 | 2 }[] = [];
    if (organizationId !== undefined) {
      links.push({ accountId: organizationId, accountType: 1 });
    }
    if (contactId !== undefined) {
      links.push({ accountId: contactId, accountType: 2 });
    }
    const linkResult = await flowluLinks.linkAccountsReported({
      client,
      leadId,
      links,
    });
    const record = await flowluOutput.fullRecord({
      client,
      module: 'crm',
      entity: 'lead',
      created,
    });
    return { ...record, ...linkResult };
  },
});

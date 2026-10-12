import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluAiBody, flowluAiProps } from '../../common/ai-props';
import { FlowluApiError } from '../../common/client';
import { flowluOpportunity } from '../../common/opportunity';
import { flowluInput } from '../../common/utils';
import { opportunityOutputSchema } from '../../output-schemas';

export const flowluOpportunityUpdate = createAction({
  auth: flowluAuth,
  name: 'flowlu_opportunity_update',
  classification: 'WRITE',
  displayName: 'Update Opportunity',
  description:
    'Updates fields on a CRM opportunity, including marking it won or lost.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes only the fields you pass on one Flowlu opportunity, identified by opportunity_id; omitted fields keep their value. Use to move it to another pipeline stage, change the amount or assignee, or close it as won or lost (status), optionally with a loss reason and comment. A Pipeline Stage ID without Pipeline ID is checked against the pipeline the opportunity is in. Requires at least one field. Idempotent: repeating the same update leaves the opportunity unchanged, and repeating Won or Lost keeps the existing close date.',
    idempotent: true,
  },
  props: {
    opportunity_id: Property.ShortText({
      displayName: 'Opportunity ID',
      description:
        'Numeric ID of the opportunity, such as "42". Get it from flowlu_find_opportunities.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New opportunity name.',
      required: false,
    }),
    ...flowluAiProps.opportunity(),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description:
        'Won or Lost closes the opportunity; In progress reopens it.',
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
    closing_date: Property.DateTime({
      displayName: 'Close Date',
      description:
        'When the opportunity was won or lost, such as "2026-10-01". When empty and Status moves the opportunity to Won or Lost, today (UTC) is used; an opportunity that already has that status keeps its close date.',
      required: false,
    }),
    closing_status_id: Property.ShortText({
      displayName: 'Loss Reason ID',
      description:
        'Why it was lost. Numeric ID from flowlu_list_lookup_values with entity loss_reasons.',
      required: false,
    }),
    closing_comment: Property.LongText({
      displayName: 'Closing Comment',
      description: 'Note about why the opportunity was won or lost.',
      required: false,
    }),
  },
  outputSchema: opportunityOutputSchema,
  async run(context) {
    const id = flowluInput.requireId({
      value: context.propsValue.opportunity_id,
      name: 'Opportunity ID',
    });
    const status = flowluInput.optionalNumber({
      value: context.propsValue.status,
      name: 'Status',
    });
    if (status !== undefined && ![1, 2, 3].includes(status)) {
      throw new FlowluApiError({
        message: 'Status must be 1 (in progress), 2 (lost) or 3 (won).',
      });
    }
    const body = flowluInput.compact({
      ...flowluAiBody.opportunity(context.propsValue),
      active: status,
      closing_date: flowluInput.formatDate({
        value: context.propsValue.closing_date,
        name: 'Close Date',
      }),
      closing_status_id: flowluInput.optionalId({
        value: context.propsValue.closing_status_id,
        name: 'Loss Reason ID',
      }),
      closing_comment: flowluInput.optionalText(
        context.propsValue.closing_comment
      ),
    });
    if (Object.keys(body).length === 0) {
      throw new FlowluApiError({
        message: 'Nothing to update: pass at least one field to change.',
      });
    }
    const client = makeClient(context.auth);
    const derived = await flowluOpportunity.stageAndCloseFields({
      client,
      opportunityId: id,
      pipelineId: flowluInput.optionalId({
        value: context.propsValue.pipeline_id,
        name: 'Pipeline ID',
      }),
      stageId: flowluInput.optionalId({
        value: context.propsValue.pipeline_stage_id,
        name: 'Pipeline Stage ID',
      }),
      status,
      closingDate: flowluInput.formatDate({
        value: context.propsValue.closing_date,
        name: 'Close Date',
      }),
    });
    return client.updateRecord(
      'crm',
      'lead',
      id,
      flowluInput.compact({ ...body, ...derived })
    );
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluFind, flowluInput, flowluSharedProps } from '../../common/utils';
import { opportunityListOutputSchema } from '../../output-schemas';

export const findOpportunitiesAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_find_opportunities',
  classification: 'SEARCH',
  displayName: 'Find Opportunities',
  description: 'Searches CRM opportunities (deals).',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Flowlu opportunities by text and optional filters for pipeline, stage, status (in progress, lost, won) and assignee, returning one page of deals with has_more for paging. Use to find an opportunity ID before reading, updating, linking or deleting it. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    search: flowluSharedProps.search(
      'Text to look for in opportunity names and other text fields. Leave empty to list all.'
    ),
    pipeline_id: Property.ShortText({
      displayName: 'Pipeline ID',
      description:
        'Only opportunities in this pipeline. Numeric ID from List Reference Values (pipelines).',
      required: false,
    }),
    pipeline_stage_id: Property.ShortText({
      displayName: 'Pipeline Stage ID',
      description:
        'Only opportunities in this stage. Numeric ID from List Reference Values (pipeline_stages).',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description:
        'Only in-progress, lost or won opportunities. Leave empty for all.',
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
    assignee_id: Property.ShortText({
      displayName: 'Assignee User ID',
      description:
        'Only opportunities assigned to this user. Numeric user ID from List Users.',
      required: false,
    }),
    order: flowluSharedProps.order(),
    page: flowluSharedProps.page(),
    limit: flowluSharedProps.limit(),
  },
  outputSchema: opportunityListOutputSchema,
  async run(context) {
    const props = context.propsValue;
    return flowluFind.run({
      client: makeClient(context.auth),
      module: 'crm',
      entity: 'lead',
      props,
      filters: {
        'filter[pipeline_id]': flowluInput.optionalId({
          value: props.pipeline_id,
          name: 'Pipeline ID',
        }),
        'filter[pipeline_stage_id]': flowluInput.optionalId({
          value: props.pipeline_stage_id,
          name: 'Pipeline Stage ID',
        }),
        'filter[active]': flowluInput.optionalNumber({
          value: props.status,
          name: 'Status',
        }),
        'filter[assignee_id]': flowluInput.optionalId({
          value: props.assignee_id,
          name: 'Assignee User ID',
        }),
      },
    });
  },
});

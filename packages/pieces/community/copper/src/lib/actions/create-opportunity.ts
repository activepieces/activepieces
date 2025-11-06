import { createAction, Property } from '@activepieces/pieces-framework';
import { CopperAuth } from '../common/constants';
import { pipelinesDropdown, primaryContactsDropdown } from '../common/props';
import { CopperApiService } from '../common/requests';

export const createOpportunity = createAction({
  auth: CopperAuth,
  name: 'createOpportunity',
  displayName: 'Create Opportunity',
  description: 'Adds a new opportunity.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the opportunity',
      required: true,
    }),
    pipelineId: pipelinesDropdown({ refreshers: ['auth'] }),
    pipelineStageId: Property.Dropdown({
      displayName: 'Pipeline Stage',
      description: 'Select a stage',
      refreshers: ['auth', 'pipelineId'],
      required: false,
      async options({ auth, pipelineId }: any) {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Copper account first',
            options: [],
          };
        }

        if (!pipelineId) {
          return {
            disabled: true,
            placeholder: 'Select a pipeline first',
            options: [],
          };
        }

        const pipeline = JSON.parse(pipelineId);

        const stages = pipeline.stages;

        return {
          options: stages.map((stage: any) => ({
            label: stage.name,
            value: stage.id,
          })),
        };
      },
    }),
    primaryContactId: primaryContactsDropdown({ refreshers: ['auth'] }),
  },
  async run(context) {
    const { name, primaryContactId, pipelineId, pipelineStageId } =
      context.propsValue;

    const pipeline = JSON.parse(pipelineId as string);

    return await CopperApiService.createOpportunity(context.auth, {
      name,
      primary_contact_id: primaryContactId,
      pipeline_id: pipeline.id,
      pipeline_stage_id: pipelineStageId,
    });
  },
});
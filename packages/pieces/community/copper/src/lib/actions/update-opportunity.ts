import {
  createAction,
  Property,
  InputPropertyMap,
} from '@activepieces/pieces-framework';
import { CopperAuth } from '../common/constants';
import {
  opportunityDropdown,
  pipelinesDropdown,
  primaryContactsDropdown,
} from '../common/props';
import { CopperApiService } from '../common/requests';

export const updateOpportunity = createAction({
  auth: CopperAuth,
  name: 'updateOpportunity',
  displayName: 'Update Opportunity',
  description: 'Updates an opportunity using match criteria.',
  props: {
    opportunityId: opportunityDropdown({
      refreshers: ['auth'],
      required: true,
    }),
    updateFields: Property.DynamicProperties({
      displayName: '',
      description: '',
      required: false,
      refreshers: ['auth', 'opportunityId'],
      props: async ({
        auth,
        opportunityId,
      }: any): Promise<InputPropertyMap> => {
        if (!auth || !opportunityId) return {};

        const opportunity = JSON.parse(opportunityId);

        return {
          name: Property.ShortText({
            displayName: 'Name',
            description: 'The name of the opportunity',
            required: true,
            defaultValue: opportunity.name,
          }),
        };
      },
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
    const {
      updateFields,
      primaryContactId,
      pipelineId,
      pipelineStageId,
      opportunityId,
    } = context.propsValue;

    const pipeline = JSON.parse(pipelineId as string);
    const opportunity = JSON.parse(opportunityId as string);

    return await CopperApiService.updateOpportunity(
      context.auth,
      opportunity.id,
      {
        name: (updateFields as any).name,
        primary_contact_id: primaryContactId,
        pipeline_id: pipeline.id,
        pipeline_stage_id: pipelineStageId,
      }
    );
  },
});

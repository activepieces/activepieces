import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { projectOutputSchema } from '../../common/output-schemas';
import { CreateProjectParams } from '../../common/types';

export const aiCreateProject = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_create_project',
  classification: 'WRITE',
  displayName: 'Create Project',
  description: 'Creates a project.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a new Capsule CRM project (case) for a party and returns it with its id. Optional Stage ID comes from List Stages and Opportunity ID from Search Opportunities. Not idempotent: each call creates another project.',
    idempotent: false,
  },
  outputSchema: projectOutputSchema,
  props: {
    party_id: Property.ShortText({ displayName: 'Party ID', description: 'Numeric ID of the main person or organisation.', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'Project name.', required: true }),
    description: Property.LongText({ displayName: 'Description', description: 'More details.', required: false }),
    stage_id: Property.ShortText({ displayName: 'Stage ID', description: 'Numeric stage ID from List Stages.', required: false }),
    opportunity_id: Property.ShortText({ displayName: 'Opportunity ID', description: 'Numeric ID of a related opportunity.', required: false }),
    expected_close_on: Property.ShortText({ displayName: 'Expected Close Date', description: 'YYYY-MM-DD.', required: false }),
    owner_id: Property.ShortText({ displayName: 'Owner User ID', description: 'Numeric user ID from List Users.', required: false }),
  },
  async run({ auth, propsValue }) {
    const params: CreateProjectParams = {
      party: { id: capsuleCrmClient.requiredId({ value: propsValue.party_id, label: 'Party ID' }) },
      name: capsuleCrmClient.requiredText({ value: propsValue.name, label: 'Name' }),
      description: capsuleCrmClient.optionalText(propsValue.description),
      expectedCloseOn: capsuleCrmClient.isoDate({ value: propsValue.expected_close_on, label: 'Expected Close Date' }),
    };
    const stageId = capsuleCrmClient.optionalId(propsValue.stage_id);
    if (stageId !== undefined) params.stage = { id: stageId };
    const opportunityId = capsuleCrmClient.optionalId(propsValue.opportunity_id);
    if (opportunityId !== undefined) params.opportunity = { id: opportunityId };
    const ownerId = capsuleCrmClient.optionalId(propsValue.owner_id);
    if (ownerId !== undefined) params.owner = { id: ownerId };
    return capsuleCrmClient.createProject({ auth, params });
  },
});

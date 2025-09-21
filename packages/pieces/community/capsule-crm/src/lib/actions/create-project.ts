import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { capsuleCrmProps } from '../common/props';

export const createProjectAction = createAction({
  auth: capsuleCrmAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Create a new project for a contact or opportunity.',
  props: {
    party_id: capsuleCrmProps.contact_id(),
    opportunity_id: capsuleCrmProps.opportunity_id(false), 
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the project.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A detailed description of the project.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    return await capsuleCrmClient.createProject(auth, {
      partyId: propsValue.party_id as number,
      name: propsValue.name,
      description: propsValue.description,
      opportunityId: propsValue.opportunity_id as number | undefined,
    });
  },
});

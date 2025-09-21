import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../../index';
import { capsuleCommon } from '../common';
import { capsuleProps } from '../common/props';

export const createProjectAction = createAction({
  auth: capsuleCrmAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Create a new project in Capsule CRM',
  
  props: {
    name: Property.ShortText({
      displayName: 'Project Name',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    partyId: capsuleProps.contactId,
  },

  async run(context) {
    const { name, description, partyId } = context.propsValue;

    const project: any = { name };
    if (description) project.description = description;
    if (partyId) project.party = { id: partyId };

    const response = await capsuleCommon.makeRequest(
      context.auth,
      HttpMethod.POST,
      '/projects',
      { project }
    );

    return response.project;
  },
});

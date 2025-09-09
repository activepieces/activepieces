import { createAction, Property } from '@activepieces/pieces-framework';
import { copperAuth } from '../../index';
import { copperRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createProject = createAction({
  auth: copperAuth,
  name: 'copper_create_project',
  displayName: 'Create Project',
  description: 'Create a new project in Copper',
  props: {
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'Name of the project',
      required: true,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Project description and details',
      required: false,
    }),
    assignee_id: Property.ShortText({
      displayName: 'Assignee ID',
      description: 'ID of the user assigned to the project',
      required: false,
    }),
    company_id: Property.ShortText({
      displayName: 'Company ID',
      description: 'ID of the associated company',
      required: false,
    }),
    related_resource: Property.Json({
      displayName: 'Related Resource',
      description: 'Related resource (opportunity, person, etc.) as JSON object',
      required: false,
    }),
  },
  async run(context) {
    const { 
      name, 
      details, 
      assignee_id, 
      company_id, 
      related_resource
    } = context.propsValue;

    const body: any = {
      name,
    };

    if (details) body.details = details;
    if (assignee_id) body.assignee_id = assignee_id;
    if (company_id) body.company_id = company_id;
    if (related_resource) body.related_resource = related_resource;

    const response = await copperRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      url: '/projects',
      body,
    });

    return response;
  },
});

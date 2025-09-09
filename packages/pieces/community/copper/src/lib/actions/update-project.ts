import { createAction, Property } from '@activepieces/pieces-framework';
import { copperAuth } from '../../index';
import { copperRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateProject = createAction({
  auth: copperAuth,
  name: 'copper_update_project',
  displayName: 'Update Project',
  description: 'Update an existing project in Copper',
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'ID of the project to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'Name of the project',
      required: false,
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
      project_id,
      name, 
      details, 
      assignee_id, 
      company_id, 
      related_resource
    } = context.propsValue;

    const body: any = {};

    if (name) body.name = name;
    if (details) body.details = details;
    if (assignee_id) body.assignee_id = assignee_id;
    if (company_id) body.company_id = company_id;
    if (related_resource) body.related_resource = related_resource;

    const response = await copperRequest({
      auth: context.auth,
      method: HttpMethod.PUT,
      url: `/projects/${project_id}`,
      body,
    });

    return response;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ziplinAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { project_idProp } from '../common/props';

export const updateProject = createAction({
  auth: ziplinAuth,
  name: 'updateProject',
  displayName: 'Update Project',
  description: "Update a project's name and description",
  props: {
    projectId: project_idProp,
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'The new name for the project',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The new description for the project',
      required: false,
    }),
  },
  async run(context) {
    const { projectId, name, description } = context.propsValue;

    const body: any = {};

    if (name) {
      body.name = name;
    }
    if (description) {
      body.description = description;
    }

    const response = await makeRequest<unknown>(
      context.auth.secret_text,
      HttpMethod.PATCH,
      `/projects/${projectId}`,
      body
    );

    return {
      success: true,
      message: "Project updated",
      data: response,
    };
  },
});

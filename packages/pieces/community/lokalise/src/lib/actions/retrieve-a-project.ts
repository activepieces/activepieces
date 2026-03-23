import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { lokaliseAuth } from '../common/auth';
import { projectDropdown } from '../common/props';

export const retrieveAProject = createAction({
  auth: lokaliseAuth,
  name: 'retrieveAProject',
  displayName: 'Retrieve a project',
  description: 'Retrieve detailed information about a Lokalise project',
  props: {
    projectId: projectDropdown,
  },
  async run(context) {
    const { projectId } = context.propsValue;

    const path = `/projects/${projectId}`;
    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      path
    );

    return response;
  },
});

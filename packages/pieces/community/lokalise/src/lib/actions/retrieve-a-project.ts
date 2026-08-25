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
  audience: 'both',
  aiMetadata: { description: 'Fetch the details and settings of a single Lokalise project by its project ID. Use to inspect project configuration or confirm a project exists. Read-only and idempotent.', idempotent: true },
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

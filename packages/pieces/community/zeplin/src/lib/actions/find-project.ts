import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ziplinAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const findProject = createAction({
  auth: ziplinAuth,
  name: 'findProject',
  displayName: 'Find Project',
  description: 'Find a project by name or retrieve all projects',
  audience: 'both',
  aiMetadata: { description: 'Look up Zeplin projects accessible to the authenticated user. With a project name it filters to partial (case-insensitive) name matches; with the name left empty it returns all projects. Use to resolve a project ID before screen or note operations. Read-only and idempotent. Note: if the name filter matches nothing, it falls back to returning all projects.', idempotent: true },
  props: {
    projectName: Property.ShortText({
      displayName: 'Project Name',
      description: 'Optional project name to search for (partial match)',
      required: false,
    }),
  },
  async run(context) {
    const { projectName } = context.propsValue;

    const projects = (await makeRequest<any[]>(
      context.auth.secret_text,
      HttpMethod.GET,
      `/projects`
    )) || [];

    if (projectName) {
      const filtered = projects.filter((project) =>
        project.name.toLowerCase().includes(projectName.toLowerCase())
      );
      return filtered.length > 0 ? filtered : projects;
    }

    return projects;
  },
});

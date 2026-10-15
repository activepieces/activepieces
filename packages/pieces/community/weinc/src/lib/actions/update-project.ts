import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { weincAuth } from '../auth';
import { compact, weincRequest, WeincProject } from '../common/client';
import { projectIdDropdown, projectStatusOptions } from '../common/props';

export const updateProject = createAction({
  auth: weincAuth,
  name: 'update_project',
  displayName: 'Update Project',
  description: "Changes a project's name, description or status.",
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates the name, description and/or status (active or archived) of a WeInc project. Only fields you fill in are changed. Idempotent: repeating the same update has the same result.',
    idempotent: true,
  },
  props: {
    projectId: projectIdDropdown,
    name: Property.ShortText({ displayName: 'Name', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: projectStatusOptions,
    }),
  },
  async run(context) {
    const { projectId, name, description, status } = context.propsValue;
    const res = await weincRequest<{ project: WeincProject }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PATCH,
      path: `/projects/${encodeURIComponent(projectId)}`,
      body: compact({ name, description, status }),
    });
    return res.project;
  },
});

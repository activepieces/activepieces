import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { weincAuth } from '../auth';
import { weincRequest, WeincProject } from '../common/client';
import { projectIdDropdown } from '../common/props';

export const getProject = createAction({
  auth: weincAuth,
  name: 'get_project',
  displayName: 'Get Project',
  description: 'Gets the details of a project.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one WeInc project by ID, including its name, status, published URL and timestamps. Read-only and idempotent.',
    idempotent: true,
  },
  props: { projectId: projectIdDropdown },
  async run(context) {
    const res = await weincRequest<{ project: WeincProject }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/projects/${encodeURIComponent(context.propsValue.projectId)}`,
    });
    return res.project;
  },
});

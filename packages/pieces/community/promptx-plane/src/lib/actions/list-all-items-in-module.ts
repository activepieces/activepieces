import { createAction, Property } from '@activepieces/pieces-framework';
import { planeAuth, baseUrl } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const listAllItemsInModule = createAction({
  name: 'list-all-items-in-module',
  displayName: 'List all work items in a module',
  description: 'Returns a list of all work items in a module.',
  props: {
    workspaceSlug: Property.ShortText({
      displayName: 'Workspace Slug',
      description:
        'The slug represents the unique workspace identifier for a workspace in Plane. It can be found in the URL. For example, in the URL https://app.plane.so/my-team/projects/, the workspace slug is my-team.',
      required: true,
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'The unique identifier of the project.',
      required: true,
    }),
    moduleId: Property.ShortText({
      displayName: 'Module ID',
      description: 'The unique identifier for the module.',
      required: true,
    }),
  },
  auth: planeAuth,
  async run(context) {
    const { workspaceSlug, projectId, moduleId } = context.propsValue;
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.GET,
      url: `${baseUrl}/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/modules/${moduleId}/module-issues/`,
      headers: {
        'X-API-Key': context.auth,
      },
    });
    return res.body;
  },
});

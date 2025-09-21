import {
  createAction,
  InputPropertyMap,
  Property,
} from '@activepieces/pieces-framework';
import { CopperAuth } from '../common/constants';
import { projectsDropdown } from '../common/props';
import { CopperApiService } from '../common/requests';

export const updateProject = createAction({
  auth: CopperAuth,
  name: 'updateProject',
  displayName: 'Update Project',
  description: 'Updates a project record.',
  props: {
    projectId: projectsDropdown({ refreshers: ['auth'], required: true }),
    updateFields: Property.DynamicProperties({
      displayName: '',
      description: '',
      refreshers: ['auth', 'projectId'],
      required: false,
      props: async ({ auth, projectId }: any): Promise<InputPropertyMap> => {
        if (!auth || !projectId) return {};

        const project = JSON.parse(projectId);

        return {
          name: Property.ShortText({
            displayName: 'Name',
            description: 'The name of the project',
            required: true,
            defaultValue: project.name,
          }),
          details: Property.ShortText({
            displayName: 'Details',
            description: 'The details of the project',
            required: false,
            defaultValue: project.details,
          }),
        };
      },
    }),
  },
  async run(context) {
    const { projectId, updateFields } = context.propsValue;

    const { name, details } = updateFields as any;

    const project = JSON.parse(projectId as string);

    return await CopperApiService.updateProject(context.auth, project.id,  {
      name,
      details,
    });
  },
});

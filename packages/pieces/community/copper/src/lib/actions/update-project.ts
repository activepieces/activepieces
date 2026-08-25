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
  audience: 'both',
  aiMetadata: {
    description:
      'Updates an existing project in Copper CRM, identified by project ID, overwriting its name and details with the supplied values. Use to modify a known project; requires the target project ID. Idempotent: re-applying the same values leaves the record in the same state.',
    idempotent: true,
  },
  props: {
    projectId: projectsDropdown({ refreshers: ['auth'], required: true }),
    updateFields: Property.DynamicProperties({
      displayName: '',
      description: '',
      refreshers: ['auth', 'projectId'],
      auth: CopperAuth,
      required: false,
      props: async ({ auth, projectId }: any): Promise<InputPropertyMap> => {
        if (!auth || !projectId) return {};

        const project = JSON.parse(projectId);

        const map:InputPropertyMap= {
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
        return map;
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

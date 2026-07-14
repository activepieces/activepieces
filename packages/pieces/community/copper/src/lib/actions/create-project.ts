import { createAction, Property } from '@activepieces/pieces-framework';
import { CopperAuth } from '../common/constants';
import { CopperApiService } from '../common/requests';

export const createProject = createAction({
  auth: CopperAuth,
  name: 'createProject',
  displayName: 'Create Project',
  description: 'Adds a new project.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new project in Copper CRM with a name and optional details. Use to add a project record. Requires a name. Not idempotent: each call creates a separate project even with identical input.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the project',
      required: true,
    }),
    details: Property.ShortText({
      displayName: 'Details',
      description: 'The details of the project',
      required: false,
    }),
  },
  async run(context) {
    const { name, details } = context.propsValue;

    return await CopperApiService.createProject(context.auth, {
      name,
      details
    })
  },
});

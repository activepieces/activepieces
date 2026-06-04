import { createAction, Property } from '@activepieces/pieces-framework';
import { beeboleAuth } from '../common/auth';
import { beeboleClient } from '../common/client';
import { beeboleProps } from '../common/props';

type CreateSubprojectResponse = {
  status: string;
  subproject?: {
    id: number;
    name: string;
    project?: { id: number; name?: string };
  };
  message?: string;
};

export const createSubprojectAction = createAction({
  auth: beeboleAuth,
  name: 'create_subproject',
  displayName: 'Create Subproject',
  description: 'Creates a new subproject under an existing project in Beebole.',
  props: {
    company: beeboleProps.companyDropdown({
      required: true,
      description: 'The company that owns the parent project.',
    }),
    project: beeboleProps.projectDropdown({
      required: true,
      description: 'The project that will contain this subproject.',
    }),
    name: Property.ShortText({
      displayName: 'Subproject Name',
      description: 'The name of the new subproject (e.g. "Prototype", "Phase 1").',
      required: true,
    }),
  },
  async run(context) {
    const response = await beeboleClient.call<CreateSubprojectResponse>({
      token: context.auth.secret_text,
      body: {
        service: 'subproject.create',
        subproject: {
          name: context.propsValue.name,
          project: { id: context.propsValue.project },
        },
      },
    });

    if (response.body.status !== 'ok') {
      throw new Error(`Beebole returned an error: ${response.body.message ?? 'Unknown error'}`);
    }

    return response.body
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { beeboleAuth } from '../common/auth';
import { beeboleClient } from '../common/client';
import { beeboleProps } from '../common/props';

type DeactivateSubprojectResponse = {
  status: string;
  message?: string;
};

export const deactivateSubprojectAction = createAction({
  auth: beeboleAuth,
  name: 'deactivate_subproject',
  displayName: 'Deactivate Subproject',
  description: 'Marks a subproject as inactive in Beebole. Inactive subprojects are hidden from new time entries.',
  props: {
    company: beeboleProps.companyDropdown({
      required: true,
      description: 'The company that owns the project.',
    }),
    project: beeboleProps.projectDropdown({
      required: true,
      description: 'The project containing the subproject to deactivate.',
    }),
    subproject: beeboleProps.subprojectDropdown({
      required: true,
      description: 'The subproject to deactivate.',
    }),
  },
  async run(context) {
    const response = await beeboleClient.call<DeactivateSubprojectResponse>({
      token: context.auth.secret_text,
      body: {
        service: 'subproject.deactivate',
        id: context.propsValue.subproject,
      },
    });

    if (response.body.status !== 'ok') {
      throw new Error(`Beebole returned an error: ${response.body.message ?? 'Unknown error'}`);
    }

    return {
      subproject_id: context.propsValue.subproject,
      project_id: context.propsValue.project,
      company_id: context.propsValue.company,
      status: response.body.status,
      deactivated: true,
    };
  },
});

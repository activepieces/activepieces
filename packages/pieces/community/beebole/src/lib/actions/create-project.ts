import { createAction, Property } from '@activepieces/pieces-framework';
import { beeboleAuth } from '../common/auth';
import { beeboleClient } from '../common/client';
import { beeboleProps } from '../common/props';

type CreateProjectResponse = {
  status: string;
  project?: {
    id: number;
    name: string;
    startDate?: string;
    description?: string;
    company?: { id: number; name?: string };
  };
  message?: string;
};

export const createProjectAction = createAction({
  auth: beeboleAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Creates a new project under a company in Beebole.',
  props: {
    company: beeboleProps.companyDropdown({
      required: true,
      description: 'The company (customer) that owns this project.',
    }),
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'The name of the new project (e.g. "Website Redesign").',
      required: true,
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'The project start date in YYYY-MM-DD format (e.g. "2026-01-15"). Leave empty for no start date.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Optional description of the project.',
      required: false,
    }),
  },
  async run(context) {
    const project: Record<string, unknown> = {
      name: context.propsValue.name,
      company: { id: context.propsValue.company },
    };
    if (context.propsValue.startDate) {
      project['startDate'] = context.propsValue.startDate;
    }
    if (context.propsValue.description) {
      project['description'] = context.propsValue.description;
    }

    const response = await beeboleClient.call<CreateProjectResponse>({
      token: context.auth.secret_text,
      body: { service: 'project.create', project },
    });

    if (response.body.status !== 'ok') {
      throw new Error(`Beebole returned an error: ${response.body.message ?? 'Unknown error'}`);
    }

    const created = response.body.project;
    return response.body
  },
});

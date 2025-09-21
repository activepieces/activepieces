import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const createProjectAction = createAction({
  auth: teamworkAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Create a new project in Teamwork.',
  props: {
    name: Property.ShortText({
      displayName: 'Project Name',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    company_id: teamworkProps.company_id(false),
    project_owner_id: teamworkProps.project_owner_id(false),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'The project start date.',
      required: false,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'The project end date.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { name, description, company_id, project_owner_id, startDate, endDate } = propsValue;

    const projectData = {
      name,
      description,
      'company-id': company_id,
      'owner-id': project_owner_id,
      'startDate': startDate,
      'endDate': endDate,
    };

    return await teamworkClient.createProject(auth as TeamworkAuth, projectData);
  },
});
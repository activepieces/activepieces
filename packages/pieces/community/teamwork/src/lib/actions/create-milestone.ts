import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth'; 
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const createMilestoneAction = createAction({
  auth: teamworkAuth,
  name: 'create_milestone',
  displayName: 'Create Milestone',
  description: 'Add a milestone with due date, description, and responsible user to a project.',
  props: {
    project_id: teamworkProps.project_id(true),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the milestone.',
      required: true,
    }),
    responsible_person_id: Property.Dropdown({
      displayName: 'Responsible Person',
      description: 'The person responsible for this milestone.',
      required: true,
      refreshers: ['auth', 'project_id'],
      options: async ({ auth, project_id }) => { 
        if (!auth || !project_id) {
          return {
            disabled: true,
            placeholder: 'Please select a project first.',
            options: [],
          };
        }

        const people = await teamworkClient.getPeopleInProject(auth as TeamworkAuth, project_id as string);
        return {
          disabled: false,
          options: people.map((person: any) => ({
            label: person['first-name'] + ' ' + person['last-name'],
            value: person.id,
          })),
        };
      },
    }),
    deadline: Property.DateTime({
      displayName: 'Deadline',
      description: 'The due date for the milestone.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the milestone.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { project_id, title, responsible_person_id, deadline, description } = propsValue;

    const milestoneData = {
      milestone: {
        title,
        deadline,
        'responsible-party-id': responsible_person_id,
        description,
      },
    };
    return await teamworkClient.createMilestone(auth as TeamworkAuth, project_id as string, milestoneData);
  },
});
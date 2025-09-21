import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const addPeopleToProjectAction = createAction({
  auth: teamworkAuth,
  name: 'add_people_to_project',
  displayName: 'Add People to Project',
  description: 'Add existing users to a project.',
  props: {
    project_id: teamworkProps.project_id(true),
    people: Property.MultiSelectDropdown({
      displayName: 'People to Add',
      description: 'Select the people to add to the project.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }
        const people = await teamworkClient.getPeople(auth as TeamworkAuth);
        return {
          disabled: false,
          options: people.map((person: any) => ({
            label: `${person['first-name']} ${person['last-name']}`,
            value: person.id,
          })),
        };
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { project_id, people } = propsValue;
    
    return await teamworkClient.addPeopleToProject(auth as TeamworkAuth, project_id as string, people as string[]);
  },
});
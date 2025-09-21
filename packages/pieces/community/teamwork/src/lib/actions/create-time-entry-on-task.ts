import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const createTimeEntryOnTaskAction = createAction({
  auth: teamworkAuth,
  name: 'create_time_entry_on_task',
  displayName: 'Create Time Entry on Task',
  description: 'Log time spent on a task with duration and a description.',
  props: {
    project_id: teamworkProps.project_id(true),
    task_list_id: teamworkProps.task_list_id(true),
    task_id: teamworkProps.task_id(true),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description of the work performed.',
      required: false,
    }),
    duration: Property.Number({
      displayName: 'Duration (in minutes)',
      description: 'The duration of the time entry in minutes.',
      required: true,
    }),
    date: Property.DateTime({
      displayName: 'Date',
      description: 'The date of the time entry.',
      required: false,
    }),
    personId: Property.Dropdown({
      displayName: 'Person',
      description: 'The person who spent the time. Defaults to the authenticated user.',
      required: false,
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
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { task_id, description, duration, date, personId } = propsValue;
    
    const timeEntryData = {
      description,
      'person-id': personId,
      'date': date,
      'time': duration ? `${duration}m` : undefined, 
    };
    
    return await teamworkClient.createTimeEntryOnTask(auth as TeamworkAuth, task_id as string, timeEntryData);
  },
});
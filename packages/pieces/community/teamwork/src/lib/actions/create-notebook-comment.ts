import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const createNotebookCommentAction = createAction({
  auth: teamworkAuth,
  name: 'create_notebook_comment',
  displayName: 'Create Notebook Comment',
  description: 'Add a comment to a notebook.',
  props: {
    project_id: teamworkProps.project_id(true),
    notebook_id: teamworkProps.notebook_id(true),
    content: Property.LongText({
      displayName: 'Comment Content',
      description: 'The content of the comment.',
      required: true,
    }),
    notify: Property.MultiSelectDropdown({
      displayName: 'Notify People',
      description: 'Select people to notify about the comment.',
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
    const { notebook_id, content, notify } = propsValue;

    const commentData = {
      body: content,
      'content-type': 'text',
      'notify': notify ? (notify as string[]).join(',') : '',
    };
    
    const resource = 'notebooks';
    const resourceId = notebook_id as string;

    return await teamworkClient.createComment(auth as TeamworkAuth, resource, resourceId, commentData);
  },
});
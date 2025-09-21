import { createAction, Property, StaticPropsValue } from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth'; 
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const createMessageReplyAction = createAction({
  auth: teamworkAuth,
  name: 'create_message_reply',
  displayName: 'Create Message Reply',
  description: 'Post a reply in a message thread.',
  props: {
    project_id: teamworkProps.project_id(true),
    message_id: teamworkProps.message_id(true),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The content of the message reply.',
      required: true,
    }),
    notify: Property.MultiSelectDropdown({
      displayName: 'Notify People',
      description: 'Select people to notify about the reply.',
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
          options: people.map((person) => ({
            label: person.name,
            value: person.id,
          })),
        };
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { message_id, content, notify } = propsValue;

    const messageReplyData = {
      content: content,
      'notify-user-ids': notify ? (notify as string[]).join(',') : '',
    };

    return await teamworkClient.createMessageReply(auth as TeamworkAuth, message_id as string, messageReplyData);
  },
});
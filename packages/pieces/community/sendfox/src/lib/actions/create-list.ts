import { createAction, Property } from '@activepieces/pieces-framework';
import { sendfoxAuth } from '../auth';
import { callsendfoxApi } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createList = createAction({
  name: 'create-list',
  auth: sendfoxAuth,
  displayName: 'Create List',
  description: 'Create a new list',
  audience: 'both',
  aiMetadata: { description: 'Creates a new contact list in SendFox with the given name. Use to set up a list before adding subscribers to it. Not idempotent: each call creates a new list even if one with the same name already exists.', idempotent: false },
  props: {
    task_name: Property.ShortText({
      displayName: 'List Name',
      required: true,
    }),
  },
  async run(context) {
    const authentication = context.auth;
    const accessToken = authentication.secret_text; 
    const task_name = context.propsValue.task_name;
    const response = (
      await callsendfoxApi(HttpMethod.POST, 'lists', accessToken, {
        name: task_name,
      })
    ).body;
    return [response];
  },
});

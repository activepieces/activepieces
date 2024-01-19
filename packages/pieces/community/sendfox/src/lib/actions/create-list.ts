import { createAction, Property } from '@activepieces/pieces-framework';
import { sendfoxAuth } from '../../index';
import { callsendfoxApi } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createList = createAction({
  name: 'create-list',
  auth: sendfoxAuth,
  displayName: 'Create List',
  description: 'Create a new list',
  props: {
    task_name: Property.ShortText({
      displayName: 'List Name',
      required: true,
    }),
  },
  async run(context) {
    const authentication = context.auth;
    const accessToken = authentication;
    const task_name = context.propsValue.task_name;
    const response = (
      await callsendfoxApi(HttpMethod.POST, 'lists', accessToken, {
        name: task_name,
      })
    ).body;
    return [response];
  },
});

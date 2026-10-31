import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../auth';
import { sendfoxClient } from '../common/client';

export const createListAction = createAction({
  name: 'create-list',
  classification: 'WRITE',
  auth: sendfoxAuth,
  displayName: 'Create List',
  description: 'Create a contact list in SendFox',
  audience: 'both',
  aiMetadata: { description: 'Creates a new contact list in SendFox with the given name. Use to set up a list before adding subscribers to it. Not idempotent: each call creates a new list even if one with the same name already exists.', idempotent: false },
  props: {
    task_name: Property.ShortText({
      displayName: 'List Name',
      required: true,
      placeholder: 'Newsletter subscribers',
    }),
  },
  async run(context) {
    const response = await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/lists',
      body: { name: context.propsValue.task_name },
    });
    return [response];
  },
});

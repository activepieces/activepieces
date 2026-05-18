import { createAction, Property } from '@activepieces/pieces-framework';
import { bushbulletAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const sendANote = createAction({
  auth: bushbulletAuth,
  name: 'sendANote',
  displayName: 'Send a Note',
  description: 'Send me a text notification',
  props: {
    title: Property.ShortText({
      displayName: 'Note Title',
      description: '',
      required: true,
    }),
    body: Property.ShortText({
      displayName: 'Note Body',
      description: '',
      required: true,
    }),
  },
  async run(context) {
    return await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/pushes',
      {
        type: 'note',
        title: context.propsValue.title,
        body: context.propsValue.body,
      }
    );
  },
});

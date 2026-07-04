import { createAction, Property } from '@activepieces/pieces-framework';
import { bushbulletAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const sendANote = createAction({
  auth: bushbulletAuth,
  name: 'sendANote',
  displayName: 'Send a Note',
  description: 'Send me a text notification',
  audience: 'both',
  aiMetadata: { description: 'Pushes a plain-text note notification (title plus body) to the authenticated Pushbullet account and its connected devices. Use this for a simple text alert or message rather than a link or file. Both title and body are required; sends a new push on every call, so it is not idempotent.', idempotent: false },
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

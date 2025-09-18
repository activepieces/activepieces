import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontProps } from '../common/props';

export const createDraft = createAction({
  auth: frontAuth,
  name: 'create_draft',
  displayName: 'Create Draft',
  description: 'Create a new draft message in a channel.',
  props: {
    channel_id: frontProps.channel(),
    author_id: frontProps.teammate({
      displayName: 'Author',
      description: 'The teammate creating the draft.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body (HTML)',
      description: 'The content of the draft. HTML is supported.',
      required: true,
    }),
    to: Property.Array({
      displayName: 'To',
      description: 'List of recipient email addresses.',
      required: false,
    }),
    cc: Property.Array({
      displayName: 'CC',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: false,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description: 'The mode of the draft, private (default) or shared.',
      required: false,
      options: {
        options: [
          { label: 'Private', value: 'private' },
          { label: 'Shared', value: 'shared' },
        ],
      },
    }),
  },
  async run(context) {
    const { channel_id, ...body } = context.propsValue;
    const token = context.auth;

    return await makeRequest(
      token,
      HttpMethod.POST,
      `/channels/${channel_id}/drafts`,
      body
    );
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { channelDropdown, teammateDropdown } from '../common/props';

export const createDraft = createAction({
  auth: frontAuth,
  name: 'create_draft',
  displayName: 'Create Draft',
  description: 'Create a new draft message in a channel.',
  props: {
    channel_id: channelDropdown,
    body: Property.LongText({
        displayName: 'Body',
        description: 'The content of the draft. HTML is supported.',
        required: true,
    }),
     author_id: teammateDropdown({
        displayName: 'Author', 
        description: "The teammate creating the draft. Defaults to the connection's owner.",
        required: false,
    }),
    to: Property.Array({ displayName: 'To', description: "List of recipient handles.", required: false }),
    cc: Property.Array({ displayName: 'Cc', required: false }),
    bcc: Property.Array({ displayName: 'Bcc', required: false }),
    subject: Property.ShortText({ displayName: 'Subject', required: false }),
    mode: Property.StaticDropdown({
        displayName: 'Mode',
        description: "Mode of the draft. 'private' is visible to the author only, 'shared' is visible to all teammates with access.",
        required: false,
        options: {
            options: [
                { label: 'Private', value: 'private' },
                { label: 'Shared', value: 'shared' },
            ]
        }
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
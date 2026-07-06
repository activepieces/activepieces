import { createAction, Property } from '@activepieces/pieces-framework';
import { linkupAuth, linkupAction, accountIdProp } from '../common';

export const sendConnectionRequest = createAction({
  auth: linkupAuth,
  name: 'send_connection_request',
  displayName: 'Send Connection Request',
  description: 'Send a LinkedIn connection invitation to a profile, with an optional note.',
  props: {
    accountId: accountIdProp,
    profileUrl: Property.ShortText({
      displayName: 'Profile URL',
      description: 'LinkedIn profile URL (provide this OR Identifier)',
      required: false,
    }),
    identifier: Property.ShortText({
      displayName: 'Identifier',
      description: 'Public identifier (e.g. "john-doe")',
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Note',
      description: 'Optional note to include with the invitation',
      required: false,
    }),
  },
  async run(context) {
    const { accountId, profileUrl, identifier, message } = context.propsValue;
    return linkupAction(context.auth.secret_text, 'network', 'invite', accountId, {
      profile_url: profileUrl,
      identifier,
      message,
    });
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { linkupAuth, linkupAction, accountIdProp } from '../common';

export const sendConnectionRequest = createAction({
  auth: linkupAuth,
  name: 'send_connection_request',
  displayName: 'Send Connection Request',
  description: 'Send a LinkedIn connection invitation to a profile, with an optional note.',
  audience: 'both',
  aiMetadata: { description: 'Sends a LinkedIn connection invitation from the connected account to a person addressed by either profile URL or public identifier, with an optional note. Use it to open contact with someone outside the account network; Send Message is for people already reachable. Requires the account ID and one of the two address inputs. Not idempotent: each call issues a fresh invitation and consumes LinkedIn invite quota, so check Check Invitation Status before retrying.', idempotent: false },
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

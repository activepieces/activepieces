import { createAction, Property } from '@activepieces/pieces-framework';
import { linkupAuth, linkupAction, accountIdProp } from '../common';

export const getProfile = createAction({
  auth: linkupAuth,
  name: 'get_profile',
  displayName: 'Get Profile Info',
  description: 'Retrieve detailed information about a LinkedIn profile by URL, public identifier, or URN.',
  props: {
    accountId: accountIdProp,
    profileUrl: Property.ShortText({
      displayName: 'Profile URL',
      description: 'Full LinkedIn profile URL (provide this OR Identifier OR URN)',
      required: false,
    }),
    identifier: Property.ShortText({
      displayName: 'Identifier',
      description: 'Public identifier (e.g. "john-doe")',
      required: false,
    }),
    profileUrn: Property.ShortText({
      displayName: 'Profile URN',
      description: 'LinkedIn profile URN',
      required: false,
    }),
  },
  async run(context) {
    const { accountId, profileUrl, identifier, profileUrn } = context.propsValue;
    return linkupAction(context.auth.secret_text, 'profiles', 'get', accountId, {
      profile_url: profileUrl,
      identifier,
      profile_urn: profileUrn,
    });
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { linkupAuth, linkupAction, accountIdProp } from '../common';

export const getProfile = createAction({
  auth: linkupAuth,
  name: 'get_profile',
  displayName: 'Get Profile Info',
  description: 'Retrieve detailed information about a LinkedIn profile by URL, public identifier, or URN.',
  audience: 'both',
  aiMetadata: { description: 'Looks up a LinkedIn person profile addressed in one of three interchangeable ways: full profile URL, public identifier, or profile URN. Use it when a specific person is already identified; use Search People to discover profiles from attributes, and Get My Profile for the connected account. Requires the account ID plus exactly one of the three address inputs. Read-only and idempotent.', idempotent: true },
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

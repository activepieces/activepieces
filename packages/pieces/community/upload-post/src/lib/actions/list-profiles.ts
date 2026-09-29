import { createAction } from '@activepieces/pieces-framework';
import { uploadPostAuth } from '../auth';
import { uploadPostProfiles } from '../common/props';

export const listProfiles = createAction({
  auth: uploadPostAuth,
  name: 'list_profiles',
  classification: 'SEARCH',
  displayName: 'List Profiles',
  description:
    'List your Upload-Post profiles and the social accounts connected to each one.',
  audience: 'both',
  aiMetadata: {
    description:
      'List every Upload-Post profile in the account with its connected social platforms. Use it to find the profile name that the upload actions need and to check which platforms a profile can publish to. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const profiles = await uploadPostProfiles.fetch(context.auth.secret_text);
    return profiles.map((profile) => ({
      username: profile.username,
      created_at: profile.created_at ?? null,
      connected_platforms: uploadPostProfiles
        .connectedPlatforms(profile)
        .join(', '),
      reauth_required_platforms: Object.entries(profile.social_accounts ?? {})
        .filter(
          ([, account]) =>
            typeof account === 'object' &&
            account !== null &&
            account.reauth_required === true,
        )
        .map(([platform]) => platform)
        .join(', '),
    }));
  },
});

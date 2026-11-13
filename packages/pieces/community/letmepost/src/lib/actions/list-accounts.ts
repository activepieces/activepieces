import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { letmepostAuth } from '../common/auth';
import { letmepostCommon } from '../common';
import { letmepostClient } from '../common/client';
import { listAccountsOutputSchema } from '../common/output-schemas';

export const listAccounts = createAction({
  auth: letmepostAuth,
  name: 'list_accounts',
  classification: 'SEARCH',
  displayName: 'List Accounts',
  description: 'List the social accounts connected to your organization',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists every connected account, returning each id, platform, display name and profile, optionally only for some platforms (bluesky, twitter for X, linkedin, instagram, facebook, threads, pinterest, tiktok). Use to discover which accounts are available and to resolve the account id required by Publish or Schedule a Post, Reply to a Post or Get an Account. Optionally narrow to one profile. Idempotent, a read-only lookup.',
    idempotent: true,
  },
  props: {
    platform: Property.StaticMultiSelectDropdown({
      displayName: 'Platform',
      description: 'Only list accounts on these platforms. Leave empty for all platforms.',
      required: false,
      options: { options: letmepostCommon.PLATFORM_OPTIONS },
    }),
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description: 'Only list accounts in this profile. Leave empty for all accounts.',
      required: false,
    }),
  },
  outputSchema: listAccountsOutputSchema,
  async run(context) {
    const body = await letmepostClient.request<{ data?: unknown }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/v1/accounts',
      query: { profileId: letmepostClient.optionalUuid({ value: context.propsValue.profileId, label: 'Profile ID' }) },
      operation: 'list the connected accounts',
    });
    const accounts = Array.isArray(body?.data) ? body.data : [];
    const platforms = Array.isArray(context.propsValue.platform)
      ? context.propsValue.platform.filter((item): item is string => typeof item === 'string' && item !== '')
      : [];
    if (platforms.length === 0) {
      return accounts;
    }
    return accounts.filter((account) => letmepostClient.isRecord(account) && typeof account['platform'] === 'string' && platforms.includes(account['platform']));
  },
});

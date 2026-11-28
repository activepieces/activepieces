import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { adaptlyPostAuth } from '../auth';
import { adaptlyPostClient } from '../common/client';
import { adaptlyPostOutput } from '../common/output';
import { adaptlyPostProps } from '../common/props';
import { AdaptlyPostAccount } from '../common/types';

export const listSocialAccountsAction = createAction({
  auth: adaptlyPostAuth,
  name: 'list_social_accounts',
  classification: 'SEARCH',
  displayName: 'List Social Accounts',
  description: 'Lists the social accounts connected to the workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'List the social accounts connected to the AdaptlyPost workspace, optionally for one platform. Each row has the account ID to pass to Create Post and a status of active or unauthorized (needs reconnecting). Safe to retry.',
    idempotent: true,
  },
  props: {
    platform: Property.StaticDropdown({
      displayName: 'Platform',
      description:
        'Only accounts on this platform. Leave empty for every platform.',
      required: false,
      options: { disabled: false, options: adaptlyPostProps.platformOptions },
    }),
  },
  async run(context) {
    const response = await adaptlyPostClient.request<{
      accounts: AdaptlyPostAccount[];
    }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/social-accounts',
    });
    const platform = context.propsValue.platform;
    return response.accounts
      .filter((account) => !platform || account.platform === platform)
      .map(adaptlyPostOutput.account);
  },
});

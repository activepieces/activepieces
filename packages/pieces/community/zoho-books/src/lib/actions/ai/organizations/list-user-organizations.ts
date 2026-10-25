import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksClient } from '../../../common/client';

export const listUserOrganizationsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_list_user_organizations',
  displayName: 'List User Organizations',
  description: 'Lists the organizations a user can access, with filters.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the organizations of a user, filtered to admin-only, active-only or same-currency organizations. Use List Organizations when no filter is needed.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description:
        'Email address of the user whose organizations are listed. Leave empty for the connected user.',
      required: false,
    }),
    showAdminOrgsOnly: zohoBooksAiProps.flag({
      required: false,
      displayName: 'Admin Organizations Only',
      description: 'Only organizations where the user is an admin.',
    }),
    showActiveOrgsOnly: zohoBooksAiProps.flag({
      required: false,
      displayName: 'Active Organizations Only',
      description: 'Only active organizations.',
    }),
    showSameCurrencyOrgsOnly: zohoBooksAiProps.flag({
      required: false,
      displayName: 'Same Currency Only',
      description: 'Only organizations that use the same currency.',
    }),
  },
  async run(context) {
    const { email, showAdminOrgsOnly, showActiveOrgsOnly, showSameCurrencyOrgsOnly } =
      context.propsValue;
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/organizations/user',
      query: {
        email,
        show_admin_orgs_only: showAdminOrgsOnly,
        show_active_orgs_only: showActiveOrgsOnly,
        show_same_currency_orgs_only: showSameCurrencyOrgsOnly,
      },
    });
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';
import { plausibleApiCall, siteIdDropdown } from '../common';

export const inviteGuest = createAction({
  auth: plausibleAuth,
  name: 'invite_guest',
  displayName: 'Invite Guest',
  description: 'Invite a guest to access a site or find an existing invitation',
  props: {
    site_id: siteIdDropdown,
    email: Property.ShortText({
      displayName: 'Email',
      description: "Guest's email address",
      required: true,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'Role to assign to the guest',
      required: true,
      options: {
        options: [
          { label: 'Viewer', value: 'viewer' },
          { label: 'Editor', value: 'editor' },
        ],
      },
    }),
  },
  async run(context) {
    const response = await plausibleApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      endpoint: '/sites/guests',
      body: {
        site_id: context.propsValue['site_id'],
        email: context.propsValue['email'],
        role: context.propsValue['role'],
      },
    });
    return response;
  },
});

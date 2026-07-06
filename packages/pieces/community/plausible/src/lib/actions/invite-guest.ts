import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';
import { plausibleApiCall, siteIdDropdown } from '../common';

export const inviteGuest = createAction({
  auth: plausibleAuth,
  name: 'invite_guest',
  displayName: 'Invite Guest',
  description: 'Invite a guest to access a site or find an existing invitation',
  audience: 'both',
  aiMetadata: { description: 'Grants a guest access to a site at a chosen role (viewer or editor) by email, or returns the existing invitation if one is already present (find-or-create). Use to share a site with another user. Idempotent, as re-inviting the same email returns the existing invitation rather than sending a duplicate.', idempotent: true },
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

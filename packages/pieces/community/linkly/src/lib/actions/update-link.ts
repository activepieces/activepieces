import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { linklyAuth } from '../auth';
import { compact, linklyApiCall, LinklyLink } from '../common/client';
import { linkDropdown, linkFieldProps, workspaceDropdown } from '../common/props';

export const updateLink = createAction({
  auth: linklyAuth,
  name: 'update_link',
  displayName: 'Update Link',
  description: 'Change the destination or settings of an existing short link. Only the fields you fill in are changed.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates an existing Linkly link by ID. Any provided field overwrites the current value; omitted fields are left unchanged. Use to redirect a short link to a new destination, rename it, add UTM tags, enable or disable it, or set an expiry. Idempotent for the same inputs.',
    idempotent: true,
  },
  props: {
    workspace_id: workspaceDropdown,
    id: linkDropdown,
    url: Property.ShortText({
      displayName: 'New destination URL',
      required: false,
    }),
    enabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Untick to pause the link.',
      required: false,
    }),
    ...linkFieldProps,
  },
  async run({ auth, propsValue }) {
    const { workspace_id, id, ...rest } = propsValue;
    const body = compact({ ...rest, workspace_id, id });
    return linklyApiCall<LinklyLink>({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: '/link',
      body,
    });
  },
});

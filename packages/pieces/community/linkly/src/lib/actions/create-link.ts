import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { linklyAuth } from '../auth';
import { compact, linklyApiCall, LinklyLink } from '../common/client';
import { linkFieldProps, workspaceDropdown } from '../common/props';

export const createLink = createAction({
  auth: linklyAuth,
  name: 'create_link',
  displayName: 'Create Short Link',
  description: 'Create a tracked short link, optionally on a branded domain with a custom slug, UTM tags, pixels and expiry.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new Linkly short link pointing at a destination URL. Optional: branded domain, custom slug, name, UTM parameters, retargeting pixels, Open Graph overrides, expiry. Returns the link record including full_url (the short link). Not idempotent: each call creates a new link unless the slug is already taken, which returns an error.',
    idempotent: false,
  },
  props: {
    workspace_id: workspaceDropdown,
    url: Property.ShortText({
      displayName: 'Destination URL',
      description: 'Where the short link should redirect to.',
      required: true,
    }),
    ...linkFieldProps,
  },
  async run({ auth, propsValue }) {
    const { workspace_id, url, ...rest } = propsValue;
    const body = compact({ ...rest, workspace_id, url });
    return linklyApiCall<LinklyLink>({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: '/link',
      body,
    });
  },
});

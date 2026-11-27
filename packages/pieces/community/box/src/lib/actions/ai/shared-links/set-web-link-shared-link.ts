import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const ACCESS = ['open', 'company', 'collaborators'];

export const setWebLinkSharedLinkAction = createAction({
  auth: boxAuth,
  name: 'box_set_web_link_shared_link',
  displayName: 'Set Web Link Shared Link',
  description: 'Creates or updates the shared link of a Box web link.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates the web link\'s shared link, or changes its access, password or expiry if it has one; returns the web link with shared_link.url. "open" makes it public to anyone with the link. Remove it with Remove Web Link Shared Link.',
    idempotent: true,
  },
  props: {
    webLinkId: boxAiProps.webLinkId({ required: true }),
    access: Property.StaticDropdown({
      displayName: 'Access',
      description: '"open" (anyone with the link), "company" (your enterprise) or "collaborators". Defaults to the enterprise setting.',
      required: false,
      options: { options: ACCESS.map((value) => ({ label: value, value })) },
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Password for the link; "open" access only.',
      required: false,
    }),
    vanityName: Property.ShortText({
      displayName: 'Vanity Name',
      description: 'Custom URL ending, at least 12 characters (paid plans).',
      required: false,
    }),
    unsharedAt: Property.DateTime({
      displayName: 'Expires At',
      description: 'When the link stops working, ISO 8601 (paid plans).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.access !== undefined && !ACCESS.includes(propsValue.access)) {
      throw new Error(`Access must be one of: ${ACCESS.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/web_links/${encodeURIComponent(propsValue.webLinkId)}`,
      query: { fields: 'shared_link' },
      body: {
        shared_link: {
          ...(propsValue.access !== undefined ? { access: propsValue.access } : {}),
          ...(propsValue.password !== undefined ? { password: propsValue.password } : {}),
          ...(propsValue.vanityName !== undefined ? { vanity_name: propsValue.vanityName } : {}),
          ...(propsValue.unsharedAt !== undefined ? { unshared_at: propsValue.unsharedAt } : {}),
        },
      },
    });
  },
});

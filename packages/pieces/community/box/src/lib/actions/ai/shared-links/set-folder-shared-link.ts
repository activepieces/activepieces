import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxSetFolderSharedLinkOutputSchema } from '../../../output-schemas';

const ACCESS = ['open', 'company', 'collaborators'];

export const setFolderSharedLinkAction = createAction({
  auth: boxAuth,
  name: 'box_set_folder_shared_link',
  outputSchema: boxSetFolderSharedLinkOutputSchema,
  displayName: 'Set Folder Shared Link',
  description: 'Creates or updates the shared link of a Box folder.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates the folder\'s shared link, or changes its access, password, expiry or download permission if it has one; returns the folder with shared_link.url. "open" makes it public to anyone with the link. Remove it with Remove Folder Shared Link.',
    idempotent: true,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true }),
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
    canDownload: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Can Download',
      description: '"true" or "false": whether people with the link can download.',
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.access !== undefined && !ACCESS.includes(propsValue.access)) {
      throw new Error(`Access must be one of: ${ACCESS.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}`,
      query: { fields: 'shared_link' },
      body: {
        shared_link: {
          ...(propsValue.access !== undefined ? { access: propsValue.access } : {}),
          ...(propsValue.password !== undefined ? { password: propsValue.password } : {}),
          ...(propsValue.vanityName !== undefined ? { vanity_name: propsValue.vanityName } : {}),
          ...(propsValue.unsharedAt !== undefined ? { unshared_at: propsValue.unsharedAt } : {}),
          ...(propsValue.canDownload !== undefined ? { permissions: { can_download: propsValue.canDownload === 'true' } } : {}),
        },
      },
    });
  },
});

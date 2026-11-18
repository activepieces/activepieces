import { createAction, Property } from '@activepieces/pieces-framework';
import type { Permission } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointClient } from '../../../common/client';
import type { GraphPage } from '../../../common/types';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointGrantSharingLinkAccessOutputSchema } from '../../../output-schemas';

const ROLE_OPTIONS = [
  { label: 'Read', value: 'read' },
  { label: 'Write', value: 'write' },
];

export const grantSharingLinkAccessAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_grant_sharing_link_access',
  outputSchema: microsoftSharepointGrantSharingLinkAccessOutputSchema,
  displayName: 'Grant Sharing Link Access',
  description: 'Gives people access to an existing sharing link.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds people by email address to an existing sharing link, given the link URL from Create Sharing Link or List File Permissions. The role must match the link\'s role unless it is an existing-access link. The returned link may have a new URL.',
    idempotent: false,
  },
  props: {
    sharingUrl: Property.ShortText({
      displayName: 'Sharing URL',
      description: 'The sharing link URL (link.webUrl). Use Create Sharing Link or List File Permissions to find it.',
      required: true,
    }),
    recipients: Property.Array({
      displayName: 'Recipients',
      description: 'Email addresses of the people to give access to.',
      required: true,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'Access to grant: "read" or "write".',
      required: true,
      options: { disabled: false, options: ROLE_OPTIONS },
    }),
  },
  async run({ auth, propsValue }) {
    if (!ROLE_OPTIONS.some((option) => option.value === propsValue.role)) {
      throw new Error('Role must be "read" or "write".');
    }
    const result: GraphPage<Permission> = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/shares/${encodeURIComponent(microsoftSharePointUtils.shareToken({ share: propsValue.sharingUrl }))}/permission/grant`
      )
      .post({
        recipients: microsoftSharePointUtils.toRecipients({ emails: propsValue.recipients, propName: 'Recipients' }),
        roles: [propsValue.role],
      });
    return result;
  },
});

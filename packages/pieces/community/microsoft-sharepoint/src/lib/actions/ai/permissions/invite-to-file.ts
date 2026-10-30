import { createAction, Property } from '@activepieces/pieces-framework';
import type { Permission } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import type { GraphPage } from '../../../common/types';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointInviteToFileOutputSchema } from '../../../output-schemas';

const ROLE_OPTIONS = [
  { label: 'Read', value: 'read' },
  { label: 'Write', value: 'write' },
];

const BOOLEAN_OPTIONS = [
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
];

export const inviteToFileAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_invite_to_file',
  outputSchema: microsoftSharepointInviteToFileOutputSchema,
  displayName: 'Invite to File',
  description: 'Shares a file or folder with people by email address.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Grants people read or write access to a file or folder by email address, optionally emailing them an invitation. Use Create Sharing Link for a link anyone in scope can open instead.',
    idempotent: false,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    recipients: Property.Array({
      displayName: 'Recipients',
      description: 'Email addresses of the people to share with.',
      required: true,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'Access to grant: "read" or "write".',
      required: true,
      options: { disabled: false, options: ROLE_OPTIONS },
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Plain text message included in the invitation, up to 2,000 characters.',
      required: false,
    }),
    sendInvitation: Property.StaticDropdown({
      displayName: 'Send Invitation',
      description: '"true" to email the recipients a sharing link, "false" to grant access without notifying them.',
      required: false,
      options: { disabled: false, options: BOOLEAN_OPTIONS },
    }),
    requireSignIn: Property.StaticDropdown({
      displayName: 'Require Sign-In',
      description: '"true" if recipients must sign in to view the item.',
      required: false,
      options: { disabled: false, options: BOOLEAN_OPTIONS },
    }),
  },
  async run({ auth, propsValue }) {
    if (!ROLE_OPTIONS.some((option) => option.value === propsValue.role)) {
      throw new Error('Role must be "read" or "write".');
    }
    const sendInvitation = microsoftSharePointUtils.booleanChoice({
      value: propsValue.sendInvitation,
      propName: 'Send Invitation',
    });
    const requireSignIn = microsoftSharePointUtils.booleanChoice({
      value: propsValue.requireSignIn,
      propName: 'Require Sign-In',
    });
    const result: GraphPage<Permission> = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/invite`
      )
      .post({
        recipients: microsoftSharePointUtils.toRecipients({ emails: propsValue.recipients, propName: 'Recipients' }),
        roles: [propsValue.role],
        ...(propsValue.message !== undefined ? { message: propsValue.message } : {}),
        ...(sendInvitation !== undefined ? { sendInvitation } : {}),
        ...(requireSignIn !== undefined ? { requireSignIn } : {}),
      });
    return result;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import type { Permission } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointCreateSharingLinkOutputSchema } from '../../../output-schemas';

const TYPE_OPTIONS = [
  { label: 'View', value: 'view' },
  { label: 'Edit', value: 'edit' },
  { label: 'Embed', value: 'embed' },
];

const SCOPE_OPTIONS = [
  { label: 'Anyone with the link', value: 'anonymous' },
  { label: 'People in the organization', value: 'organization' },
  { label: 'Specific people', value: 'users' },
];

export const createSharingLinkAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_create_sharing_link',
  outputSchema: microsoftSharepointCreateSharingLinkOutputSchema,
  displayName: 'Create Sharing Link',
  description: 'Creates a sharing link for a file or folder.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a view, edit or embed sharing link for a file or folder, or returns the existing link of that type. Use Invite to File to share with named people by email instead; Grant Sharing Link Access adds people to the link.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    type: Property.StaticDropdown({
      displayName: 'Link Type',
      description: '"view" for read-only, "edit" for read-write, "embed" for an embeddable link (OneDrive personal only).',
      required: true,
      options: { disabled: false, options: TYPE_OPTIONS },
    }),
    scope: Property.StaticDropdown({
      displayName: 'Scope',
      description:
        'Who can use the link: "anonymous", "organization" or "users". Leave empty for the organization default.',
      required: false,
      options: { disabled: false, options: SCOPE_OPTIONS },
    }),
    expirationDateTime: Property.DateTime({
      displayName: 'Expiration Date',
      description: 'When the link expires, in ISO 8601 format like "2026-12-31T23:59:59Z".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (!TYPE_OPTIONS.some((option) => option.value === propsValue.type)) {
      throw new Error('Link Type must be "view", "edit" or "embed".');
    }
    if (
      propsValue.scope !== undefined &&
      !SCOPE_OPTIONS.some((option) => option.value === propsValue.scope)
    ) {
      throw new Error('Scope must be "anonymous", "organization" or "users".');
    }
    const permission: Permission = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/createLink`
      )
      .post({
        type: propsValue.type,
        ...(propsValue.scope !== undefined ? { scope: propsValue.scope } : {}),
        ...(propsValue.expirationDateTime !== undefined
          ? { expirationDateTime: propsValue.expirationDateTime }
          : {}),
      });
    return permission;
  },
});

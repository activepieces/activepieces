import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { GraphDriveItem, oneDriveApi } from '../common/graph-api';
import { onedriveResolveSharingLinkOutputSchema } from '../output-schemas';

export const onedriveResolveSharingLink = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_resolve_sharing_link',
  displayName: 'Resolve Sharing Link',
  description: 'Look up the file or folder behind a OneDrive or SharePoint sharing link.',
  audience: 'ai',
  outputSchema: onedriveResolveSharingLinkOutputSchema,
  classification: 'READ',
  aiMetadata: {
    description:
      'Turns a OneDrive (1drv.ms, onedrive.live.com) or SharePoint sharing URL, or an existing share token, into the item it points to, including its item ID and drive ID. Use it when a user pastes a link and you need the item for other actions; it only peeks at the link and does not add the item to the user\'s drive, and an item in someone else\'s drive has a different drive ID that the other item actions here cannot address.',
    idempotent: true,
  },
  props: {
    sharingUrl: Property.ShortText({
      displayName: 'Sharing Link or Share Token',
      description: 'The sharing URL, or a share token starting with u! or s!.',
      placeholder: 'https://1drv.ms/...',
      required: true,
    }),
  },
  async run(context) {
    const shareId = toShareId({ value: context.propsValue.sharingUrl });
    const item = await oneDriveApi.request<GraphDriveItem>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/shares/${encodeURIComponent(shareId)}/driveItem`,
      headers: { Prefer: 'redeemSharingLinkIfNecessary' },
    });
    return {
      ...oneDriveApi.toItem(item),
      shareId,
    };
  },
});

function toShareId({ value }: { value: string }): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Provide a sharing link or share token.');
  }
  if (/^[us]!/.test(trimmed)) {
    return trimmed;
  }
  const encoded = Buffer.from(trimmed, 'utf8')
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\//g, '_')
    .replace(/\+/g, '-');
  return `u!${encoded}`;
}

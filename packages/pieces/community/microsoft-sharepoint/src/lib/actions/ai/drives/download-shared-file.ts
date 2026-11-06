import { createAction, Property } from '@activepieces/pieces-framework';
import type { DriveItem } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointDownloadSharedFileOutputSchema } from '../../../output-schemas';

export const downloadSharedFileAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_download_shared_file',
  outputSchema: microsoftSharepointDownloadSharedFileOutputSchema,
  displayName: 'Download Shared File',
  description: 'Downloads a file from a SharePoint or OneDrive sharing link.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads the file behind a SharePoint or OneDrive sharing URL (or a share ID) and returns it as a file with the item metadata. Use Download File when you have the drive and item IDs; links to folders are rejected.',
    idempotent: true,
  },
  props: {
    share: Property.ShortText({
      displayName: 'Sharing URL or Share ID',
      description:
        'A sharing link like "https://contoso.sharepoint.com/:w:/s/team/Eabc...", or a share ID returned by Microsoft Graph.',
      required: true,
    }),
  },
  async run({ auth, propsValue, files }) {
    const client = microsoftSharePointClient.create({ auth });
    const itemPath = `/shares/${encodeURIComponent(microsoftSharePointUtils.shareToken({ share: propsValue.share }))}/driveItem`;
    const item: DriveItem = await client.api(itemPath).get();
    if (!item.file) {
      throw new Error(
        `"${item.name ?? propsValue.share}" is a folder, not a file, so it cannot be downloaded.`
      );
    }
    const data = await microsoftSharePointClient.download({ auth, path: `${itemPath}/content` });
    const fileName = item.name ?? 'shared-file';
    const file = await files.write({ fileName, data });
    return { file, fileName, item };
  },
});

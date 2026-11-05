import { createAction, Property } from '@activepieces/pieces-framework';
import type { DriveItem, DriveItemVersion } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointDownloadFileVersionOutputSchema } from '../../../output-schemas';

export const downloadFileVersionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_download_file_version',
  outputSchema: microsoftSharepointDownloadFileVersionOutputSchema,
  displayName: 'Download File Version',
  description: 'Downloads the content of a previous version of a file in a document library.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads the content of a previous version of a file in a document library and returns it as a file with the version details. Microsoft Graph rejects the current version; use Download File for that. List File Versions returns the version IDs.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    versionId: Property.ShortText({
      displayName: 'Version ID',
      description:
        'ID of a previous file version, like "1.0". Use List File Versions to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue, files }) {
    const client = microsoftSharePointClient.create({ auth });
    const itemPath = `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}`;
    const versionPath = `${itemPath}/versions/${encodeURIComponent(propsValue.versionId)}`;
    const item: DriveItem = await client.api(itemPath).select('id,name').get();
    const version: DriveItemVersion = await client.api(versionPath).get();
    const data = await microsoftSharePointClient.download({ auth, path: `${versionPath}/content` });
    const fileName = item.name ?? `${propsValue.itemId}-${propsValue.versionId}`;
    const file = await files.write({ fileName, data });
    return { file, fileName, version };
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import type { DriveItemVersion } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointGetFileVersionOutputSchema } from '../../../output-schemas';

export const getFileVersionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_file_version',
  outputSchema: microsoftSharepointGetFileVersionOutputSchema,
  displayName: 'Get File Version',
  description: 'Gets the details of one version of a file in a document library.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the size and modification details of one version of a file in a document library, without its content. Use Download File Version for the content; List File Versions returns the version IDs.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    versionId: Property.ShortText({
      displayName: 'Version ID',
      description: 'ID of the file version, like "2.0". Use List File Versions to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const version: DriveItemVersion = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/versions/${encodeURIComponent(propsValue.versionId)}`
      )
      .get();
    return version;
  },
});

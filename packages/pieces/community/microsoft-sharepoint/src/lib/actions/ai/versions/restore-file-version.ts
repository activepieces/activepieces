import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointRestoreFileVersionOutputSchema } from '../../../output-schemas';

export const restoreFileVersionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_restore_file_version',
  outputSchema: microsoftSharepointRestoreFileVersionOutputSchema,
  displayName: 'Restore File Version',
  description: 'Restores a previous version of a file in a document library.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Makes a previous version of a file the current one by saving its content as a new version; all existing versions are kept. Each call adds another version. List File Versions returns the version IDs.',
    idempotent: false,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    versionId: Property.ShortText({
      displayName: 'Version ID',
      description:
        'ID of the file version to restore, like "1.0". Use List File Versions to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await microsoftSharePointClient
      .create({ auth })
      .api(
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/versions/${encodeURIComponent(propsValue.versionId)}/restoreVersion`
      )
      .post({});
    return {
      success: true,
      driveId: propsValue.driveId,
      itemId: propsValue.itemId,
      versionId: propsValue.versionId,
    };
  },
});

import { createAction } from '@activepieces/pieces-framework';
import type { Drive } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointGetDriveOutputSchema } from '../../../output-schemas';

export const getDriveAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_drive',
  outputSchema: microsoftSharepointGetDriveOutputSchema,
  displayName: 'Get Drive',
  description: 'Gets a document library (drive) by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one document library (drive) by its ID, with its name, type, owner, quota and URL. List Site Drives and Get Site Default Drive return drive IDs.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const drive: Drive = await microsoftSharePointClient
      .create({ auth })
      .api(`/drives/${encodeURIComponent(propsValue.driveId)}`)
      .get();
    return drive;
  },
});

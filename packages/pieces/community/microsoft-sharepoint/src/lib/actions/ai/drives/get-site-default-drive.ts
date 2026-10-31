import { createAction } from '@activepieces/pieces-framework';
import type { Drive } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointGetDriveOutputSchema } from '../../../output-schemas';

export const getSiteDefaultDriveAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_site_default_drive',
  outputSchema: microsoftSharepointGetDriveOutputSchema,
  displayName: 'Get Site Default Drive',
  description: 'Gets the default document library (drive) of a SharePoint site.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the default document library (usually "Documents") of a SharePoint site, with its drive ID, owner and quota. Use List Site Drives to see every library on the site.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const drive: Drive = await microsoftSharePointClient
      .create({ auth })
      .api(`/sites/${encodeURIComponent(propsValue.siteId)}/drive`)
      .get();
    return drive;
  },
});

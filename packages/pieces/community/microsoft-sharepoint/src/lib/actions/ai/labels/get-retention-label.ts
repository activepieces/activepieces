import { createAction } from '@activepieces/pieces-framework';
import type { ItemRetentionLabel } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointGetRetentionLabelOutputSchema } from '../../../output-schemas';

export const getRetentionLabelAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_retention_label',
  outputSchema: microsoftSharepointGetRetentionLabelOutputSchema,
  displayName: 'Get Retention Label',
  description: 'Gets the retention label applied to a file or folder.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the Purview retention label on a file or folder, with its retention settings, whether the record is locked, and who applied it when. List Folder Children, Find File or Search return the item ID.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const label: ItemRetentionLabel = await microsoftSharePointClient
      .create({ auth })
      .api(`/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/retentionLabel`)
      .get();
    return label;
  },
});

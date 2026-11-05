import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointRemoveRetentionLabelOutputSchema } from '../../../output-schemas';

export const removeRetentionLabelAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_remove_retention_label',
  outputSchema: microsoftSharepointRemoveRetentionLabelOutputSchema,
  displayName: 'Remove Retention Label',
  description: 'Removes the retention label from a file or folder.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes the Purview retention label from a file or folder and clears every retention setting it enforced. Works on non-record labels only: removing a label that marks content as a record needs Sites.FullControl.All, which this connection does not request. Set Retention Label applies a label again.',
    idempotent: false,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await microsoftSharePointClient
      .create({ auth })
      .api(`/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/retentionLabel`)
      .delete();
    return { removed: true };
  },
});

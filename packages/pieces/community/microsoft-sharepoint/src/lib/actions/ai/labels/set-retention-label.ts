import { createAction, Property } from '@activepieces/pieces-framework';
import type { ItemRetentionLabel } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointRetentionLabelOutputSchema } from '../../../output-schemas';

export const setRetentionLabelAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_set_retention_label',
  outputSchema: microsoftSharepointRetentionLabelOutputSchema,
  displayName: 'Set Retention Label',
  description: 'Applies a retention label to a file or folder.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Applies a Purview retention label, by name, to a file or folder; on a folder every item inside gets the same label. Replaces any label already applied. Changing a label that marks content as a record needs Sites.FullControl.All, which this connection does not request. Get Retention Label shows the current label.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    name: Property.ShortText({
      displayName: 'Label Name',
      description: 'Exact name of the retention label, as shown in Microsoft Purview.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const label: ItemRetentionLabel = await microsoftSharePointClient
      .create({ auth })
      .api(`/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/retentionLabel`)
      .patch({ name: propsValue.name });
    return label;
  },
});

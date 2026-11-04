import { createAction, Property } from '@activepieces/pieces-framework';
import type { ItemRetentionLabel } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointRetentionLabelOutputSchema } from '../../../output-schemas';

export const lockOrUnlockRecordAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_lock_or_unlock_record',
  outputSchema: microsoftSharepointRetentionLabelOutputSchema,
  displayName: 'Lock or Unlock Record',
  description: 'Locks or unlocks a file or folder whose retention label marks it as a record.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Locks or unlocks a file or folder whose Purview retention label classifies it as a record; unlocking allows edits under record versioning. Fails on items without a record label. Get Retention Label shows the label and whether it is locked.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    isRecordLocked: Property.StaticDropdown({
      displayName: 'Locked',
      description: '"true" to lock the record, "false" to unlock it.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Lock', value: 'true' },
          { label: 'Unlock', value: 'false' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const label: ItemRetentionLabel = await microsoftSharePointClient
      .create({ auth })
      .api(`/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/retentionLabel`)
      .patch({
        retentionSettings: {
          isRecordLocked: microsoftSharePointUtils.booleanChoice({
            value: propsValue.isRecordLocked,
            propName: 'Locked',
          }),
        },
      });
    return label;
  },
});

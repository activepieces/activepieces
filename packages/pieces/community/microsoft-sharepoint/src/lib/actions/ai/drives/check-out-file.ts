import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointCheckInFileOutputSchema } from '../../../output-schemas';

export const checkOutFileAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_check_out_file',
  outputSchema: microsoftSharepointCheckInFileOutputSchema,
  displayName: 'Check Out File',
  description: 'Checks out a file so only you can edit it until it is checked in.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Checks out a file in a document library so other users cannot change it until it is checked in. Finish with Check In File to publish the changes or Discard Checkout to drop them. List Folder Children, Find File and Search return item IDs.',
    idempotent: false,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await microsoftSharePointClient
      .create({ auth })
      .api(
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/checkout`
      )
      .post(undefined);
    return { success: true };
  },
});

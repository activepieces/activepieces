import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointCheckInFileOutputSchema } from '../../../output-schemas';

export const discardCheckoutAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_discard_checkout',
  outputSchema: microsoftSharepointCheckInFileOutputSchema,
  displayName: 'Discard Checkout',
  description: 'Discards the checkout of a file, dropping changes made while it was checked out.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Releases the checkout of a file and throws away every change made since Check Out File, restoring the last checked-in version. Use Check In File to keep the changes instead. Fails if the file is not checked out or another user checked it out.',
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
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/discardCheckout`
      )
      .post(undefined);
    return { success: true };
  },
});

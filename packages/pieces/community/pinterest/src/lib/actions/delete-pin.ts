import { createAction } from '@activepieces/pieces-framework';
import { pinterestAuth } from '../common/auth';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { deletePinOperation } from '../common/operations';
import { adAccountIdDropdown, pinIdDropdown } from '../common/props';
import { deletePinActionOutputSchema } from '../output-schemas';

export const deletePin = createAction({
  auth: pinterestAuth,
  name: 'deletePin',
  classification: 'DESTRUCTIVE',
  outputSchema: deletePinActionOutputSchema,
  displayName: 'Delete Pin',
  description: 'Permanently delete a specific Pin.',
  audience: 'human',
  aiMetadata: {
    description:
      'Permanently deletes a single Pin identified by its pin_id. Use to remove published content from Pinterest; this is destructive and cannot be undone. Repeating the call after the Pin is gone returns an error rather than re-deleting, so treat it as not idempotent.',
    idempotent: false,
  },
  props: {
    pin_id: pinIdDropdown,
    ad_account_id: adAccountIdDropdown,
  },
  async run({ auth, propsValue }) {
    return await deletePinOperation({
      accessToken: getAccessTokenOrThrow(auth),
      pin_id: propsValue.pin_id,
      ad_account_id: propsValue.ad_account_id,
    });
  },
});

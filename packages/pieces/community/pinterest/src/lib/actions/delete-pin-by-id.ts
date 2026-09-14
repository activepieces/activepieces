import { createAction, Property } from '@activepieces/pieces-framework';
import { pinterestAuth } from '../common/auth';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { deletePinOperation } from '../common/operations';
import { deletePinActionOutputSchema } from '../output-schemas';

export const deletePinById = createAction({
  auth: pinterestAuth,
  name: 'deletePinById',
  classification: 'DESTRUCTIVE',
  outputSchema: deletePinActionOutputSchema,
  displayName: 'Delete Pin by ID',
  description: 'Permanently delete a Pin.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one Pin by id. Pinterest has no trash for Pins, so this cannot be undone; confirm the Pin with Get Pin first, and use Update Pin to move a Pin to another board when the goal is to tidy up rather than destroy. Deleting an already-deleted Pin returns an error rather than succeeding, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    pin_id: Property.ShortText({
      displayName: 'Pin ID',
      required: true,
      description: 'Numeric pin id, as returned by List Pins or Search Pins.',
    }),
  },
  async run({ auth, propsValue }) {
    return await deletePinOperation({
      accessToken: getAccessTokenOrThrow(auth),
      pin_id: propsValue.pin_id,
    });
  },
});

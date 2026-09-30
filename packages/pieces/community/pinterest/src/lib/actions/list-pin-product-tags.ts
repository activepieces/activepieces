import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { listPinProductTagsActionOutputSchema } from '../output-schemas';

export const listPinProductTags = createAction({
  auth: pinterestAuth,
  name: 'listPinProductTags',
  classification: 'READ',
  outputSchema: listPinProductTagsActionOutputSchema,
  displayName: 'List Pin Product Tags',
  description: 'List the product tags attached to a Pin.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the product tags attached to one Pin, returning each tagged product with its id and position on the image. Use it to check what a shoppable Pin currently links to before editing it. Requires a numeric pin id from List Pins, and returns an empty list for Pins with no tags rather than failing. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    pin_id: Property.ShortText({
      displayName: 'Pin ID',
      required: true,
      description: 'Numeric pin id, as returned by List Pins.',
    }),
  },
  async run({ auth, propsValue }) {
    const { pin_id } = propsValue;

    const response = await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.GET,
      `/pins/${pin_id}/product_tags`
    );

    const items = response.product_tags ?? [];
    return { items, count: items.length };
  },
});

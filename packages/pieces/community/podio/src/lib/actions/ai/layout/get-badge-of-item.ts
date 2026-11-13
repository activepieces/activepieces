import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetBadgeOfItemOutputSchema } from '../../../output-schemas';

export const getBadgeOfItemAction = createAction({
  auth: podioAuth,
  name: 'podio_get_badge_of_item',
  outputSchema: podioGetBadgeOfItemOutputSchema,
  displayName: 'Get Badge of Item',
  description: 'Gets an item rendered in its app\'s badge or relationship layout.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio item as shown in its app\'s badge or relationship layout: the compact summary with header, content, details and footer values. For all of the item\'s values use Get Item. The item id comes from Filter Items or Get Item.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item.' }),
    layoutType: podioAiProps.choice({
      required: true,
      displayName: 'Layout Type',
      description: '"badge" for the item card, "relationship" for how the item looks when referenced from other apps.',
      values: ['badge', 'relationship'],
    }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/item/${propsValue.itemId}/badge/${propsValue.layoutType}` });
  },
});

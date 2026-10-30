import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseMoveCardsOutputSchema } from '../../output-schemas';

export const moveCardsAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_move_cards',
  outputSchema: metabaseMoveCardsOutputSchema,
  displayName: 'Move Cards',
  description: 'Move several saved questions to a collection or dashboard.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Moves one or more questions (cards) into a collection, or into a dashboard, in one call. Set exactly one of Collection ID or Dashboard ID. Re-running converges on the same placement.',
    idempotent: true,
  },
  props: {
    cardIds: Property.Array({
      displayName: 'Card IDs',
      description:
        'Numeric IDs of the cards to move, from List Cards or Search.',
      required: true,
    }),
    collectionId: metabaseAiProps.collectionId({
      required: false,
      description: 'Target collection ID, from List Collections.',
    }),
    dashboardId: metabaseAiProps.dashboardId({
      required: false,
      description: 'Target dashboard ID, from List Dashboards.',
    }),
  },
  async run({ auth, propsValue }) {
    const cardIds = propsValue.cardIds;
    if (
      cardIds.length === 0 ||
      !cardIds.every(
        (id): id is number => typeof id === 'number' && Number.isInteger(id)
      )
    ) {
      throw new Error('Card IDs must be a non-empty list of numeric card IDs.');
    }
    if (
      (propsValue.collectionId === undefined) ===
      (propsValue.dashboardId === undefined)
    ) {
      throw new Error('Set exactly one of Collection ID or Dashboard ID.');
    }
    return await metabaseApi.moveCards({
      auth,
      cardIds,
      collectionId: propsValue.collectionId,
      dashboardId: propsValue.dashboardId,
    });
  },
});

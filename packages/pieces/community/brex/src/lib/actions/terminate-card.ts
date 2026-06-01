import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { brexAuth } from '../../';
import { brexCommon, BrexCard } from '../common';

export const terminateCard = createAction({
  auth: brexAuth,
  name: 'terminate_card',
  displayName: 'Terminate Card',
  description:
    'Permanently terminate a card. This cannot be undone — the card can never be used again.',
  props: {
    cardId: brexCommon.cardDropdown,
    reason: Property.StaticDropdown({
      displayName: 'Reason',
      description: 'Why the card is being terminated.',
      required: true,
      defaultValue: 'CARD_NOT_NEEDED',
      options: {
        options: [
          { label: 'Card not needed', value: 'CARD_NOT_NEEDED' },
          { label: 'Card lost', value: 'CARD_LOST' },
          { label: 'Card damaged', value: 'CARD_DAMAGED' },
          { label: 'Card not received', value: 'CARD_NOT_RECEIVED' },
          { label: 'Suspected fraud', value: 'FRAUD' },
        ],
      },
    }),
  },
  async run(context) {
    const response = await brexCommon.apiCall<BrexCard>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/cards/${context.propsValue.cardId}/terminate`,
      body: {
        reason: context.propsValue.reason,
      },
    });
    return brexCommon.flattenCard(response.body);
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { brexAuth } from '../../';
import { brexCommon, BrexCard } from '../common';

export const lockCard = createAction({
  auth: brexAuth,
  name: 'lock_card',
  displayName: 'Lock Card',
  description: 'Temporarily lock a card so it cannot be used. It can be unlocked later.',
  props: {
    cardId: brexCommon.cardDropdown,
  },
  async run(context) {
    const response = await brexCommon.apiCall<BrexCard>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/cards/${context.propsValue.cardId}/lock`,
      body: {},
    });
    return brexCommon.flattenCard(response.body);
  },
});

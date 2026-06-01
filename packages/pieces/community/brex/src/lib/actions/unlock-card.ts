import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { brexAuth } from '../../';
import { brexCommon, BrexCard } from '../common';

export const unlockCard = createAction({
  auth: brexAuth,
  name: 'unlock_card',
  displayName: 'Unlock Card',
  description: 'Unlock a previously locked card so it can be used again.',
  props: {
    cardId: brexCommon.cardDropdown,
  },
  async run(context) {
    const response = await brexCommon.apiCall<BrexCard>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/cards/${context.propsValue.cardId}/unlock`,
      body: {},
    });
    return brexCommon.flattenCard(response.body);
  },
});

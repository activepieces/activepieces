import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { brexAuth } from '../../';
import { brexCommon, BrexCard } from '../common';

export const getCard = createAction({
  auth: brexAuth,
  name: 'get_card',
  displayName: 'Get Card',
  description: 'Get the details of a single Brex card.',
  props: {
    cardId: brexCommon.cardDropdown,
  },
  async run(context) {
    const response = await brexCommon.apiCall<BrexCard>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v2/cards/${context.propsValue.cardId}`,
    });
    return brexCommon.flattenCard(response.body);
  },
});

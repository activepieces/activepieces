import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const campaignControl = createAction({
  auth: famulorAuth,
  name: 'campaignControl',
  displayName: 'Start/Stop Campaign',
  description: 'Start or stop an outbound calling campaign. Starting requires sufficient leads; stopping cancels ongoing calls.',
  props: famulorCommon.campaignControlProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.campaignControlSchema);

    return await famulorCommon.campaignControl({
      auth: auth as string,
      campaign_id: propsValue.campaign,
      action: propsValue.action as 'start' | 'stop',
    });
  },
});
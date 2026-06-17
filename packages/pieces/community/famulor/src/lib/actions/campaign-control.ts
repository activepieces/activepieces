import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const campaignControl = createAction({
  auth: famulorAuth,
  name: 'campaignControl',
  displayName: 'Start/Stop Campaign',
  description: 'Start or stop an outbound calling campaign.',
  audience: 'both',
  aiMetadata: {
    description:
      'Start or stop an outbound calling campaign by campaign ID, choosing the action via the start/stop mode. Use to launch bulk outbound dialing of a campaign\'s leads or to halt it. Idempotent with respect to end state: starting an already-running campaign or stopping a stopped one converges on the requested state.',
    idempotent: true,
  },
  props: famulorCommon.campaignControlProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.campaignControlSchema);

    return await famulorCommon.campaignControl({
      auth: auth.secret_text,
      campaign_id: propsValue.campaign,
      action: propsValue.action as 'start' | 'stop',
    });
  },
});
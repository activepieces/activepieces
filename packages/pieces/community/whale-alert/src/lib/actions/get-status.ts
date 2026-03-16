import { createAction } from '@activepieces/pieces-framework';
import { whaleAlertAuth } from '../../index';
import { makeWhaleAlertRequest } from '../common/whale-alert-api';

export const getStatus = createAction({
  auth: whaleAlertAuth,
  name: 'get_status',
  displayName: 'Get API Status',
  description: 'Get Whale Alert API status including blockchain sync information and supported symbols.',
  props: {},
  async run({ auth }) {
    return makeWhaleAlertRequest(auth as string, '/status', {});
  },
});

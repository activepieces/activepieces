import { createPiece } from '@activepieces/pieces-framework';

import { seventeenTrackAuth } from './lib/auth';
import { getQuota } from './lib/actions/get-quota';
import { getRealtimeTrackingDetails } from './lib/actions/get-realtime-tracking-details';
import { getTrackingDetails } from './lib/actions/get-tracking-details';
import { listTrackings } from './lib/actions/list-trackings';
import { registerTrackings } from './lib/actions/register-trackings';
import { restartTrackings } from './lib/actions/restart-trackings';
import { stopTrackings } from './lib/actions/stop-trackings';
import { deleteTrackings } from './lib/actions/delete-trackings';
import { pushTrackings } from './lib/actions/push-trackings';
import { changeCarrier } from './lib/actions/change-carrier';
import { updateTrackingInfo } from './lib/actions/update-tracking-info';

export const seventeenTrack = createPiece({
  displayName: '17TRACK',
  description:
    'Cross-border e-commerce order tracking for 2900+ carriers with automatic status updates',
  auth: seventeenTrackAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://res.17track.net/global-v2/imgs/oauth_image/apple_touch_152x152.png',
  authors: ['electroluxcode'],
  actions: [
    registerTrackings,
    getTrackingDetails,
    listTrackings,
    getQuota,
    stopTrackings,
    restartTrackings,
    deleteTrackings,
    pushTrackings,
    changeCarrier,
    updateTrackingInfo,
    getRealtimeTrackingDetails,
  ],
  triggers: [],
});

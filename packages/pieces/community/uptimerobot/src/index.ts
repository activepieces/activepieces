import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { getMonitorsAction } from './lib/actions/get-monitors';
import { createMonitorAction } from './lib/actions/create-monitor';
import { editMonitorAction } from './lib/actions/edit-monitor';
import { deleteMonitorAction } from './lib/actions/delete-monitor';
import { getAlertContactsAction } from './lib/actions/get-alert-contacts';
import { monitorStatusChangeTrigger } from './lib/triggers/monitor-status-change';
import { uptimeRobotApiCall } from './lib/common';

export const uptimeRobotAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your UptimeRobot API key:

1. Log in to your [UptimeRobot dashboard](https://dashboard.uptimerobot.com/)
2. Go to **My Settings** (click your name in the top-right)
3. Scroll down to **API Settings**
4. Copy your **Main API Key** (starts with \`u\`)

The Main API Key gives full access. Use a Read-Only key if you only need to read monitor data.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await uptimeRobotApiCall<{ stat: string }>({
        apiKey: auth,
        endpoint: 'getAccountDetails',
      });
      if (response.body.stat === 'ok') {
        return { valid: true };
      }
      return { valid: false, error: 'Invalid API Key — check that you copied the full key from UptimeRobot settings.' };
    } catch {
      return { valid: false, error: 'Could not connect to UptimeRobot. Please try again.' };
    }
  },
});

export const uptimerobot = createPiece({
  displayName: 'UptimeRobot',
  description: 'Website monitoring and uptime tracking for your servers, websites, and APIs.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/uptimerobot.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  auth: uptimeRobotAuth,
  authors: ['pfeiffer-research-agent'],
  actions: [
    getMonitorsAction,
    createMonitorAction,
    editMonitorAction,
    deleteMonitorAction,
    getAlertContactsAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.uptimerobot.com/v2',
      auth: uptimeRobotAuth,
      authMapping: async (auth) => ({
        'Content-Type': 'application/json',
      }),
      description: 'Send a custom request to the UptimeRobot API. Important: UptimeRobot uses POST with api_key in the request body (not headers). Include `"api_key": "YOUR_KEY"` in the request body for every call.',
    }),
  ],
  triggers: [monitorStatusChangeTrigger],
});

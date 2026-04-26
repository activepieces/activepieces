import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { uptimeRobotAuth } from './lib/auth';
import { getMonitorsAction } from './lib/actions/get-monitors';
import { createMonitorAction } from './lib/actions/create-monitor';
import { editMonitorAction } from './lib/actions/edit-monitor';
import { deleteMonitorAction } from './lib/actions/delete-monitor';
import { pauseResumeMonitorAction } from './lib/actions/pause-resume-monitor';
import { monitorStatusChangeTrigger } from './lib/triggers/monitor-status-change';

export { uptimeRobotAuth };

export const uptimeRobot = createPiece({
  displayName: 'UptimeRobot',
  description: 'Monitor your websites, APIs, and servers. Get alerted when things go down.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/uptimerobot.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  auth: uptimeRobotAuth,
  authors: ['majewskibartosz'],
  actions: [
    getMonitorsAction,
    createMonitorAction,
    editMonitorAction,
    deleteMonitorAction,
    pauseResumeMonitorAction,
  ],
  triggers: [monitorStatusChangeTrigger],
});

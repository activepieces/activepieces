import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { figraniumAuth } from './lib/auth';
import { executeTaskAction } from './lib/actions/execute-task';
import { listTasksAction } from './lib/actions/list-tasks';
import { listExecutionsAction } from './lib/actions/list-executions';
import { listSchedulesAction } from './lib/actions/list-schedules';
import { getScheduleStatusAction } from './lib/actions/get-schedule-status';
import { getSchedulerStatusAction } from './lib/actions/get-scheduler-status';
import { setScheduleAction } from './lib/actions/set-schedule';
import { deleteScheduleAction } from './lib/actions/delete-schedule';
import { describeScheduleAction } from './lib/actions/describe-schedule';

export const figranium = createPiece({
  displayName: 'Figranium',
  description: 'Interact with Figranium — trigger browser-automation tasks, inspect executions, and manage schedules.',
  auth: figraniumAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl:
    'https://raw.githubusercontent.com/figranium/figranium/0bde46ef4c05ff97a1304313145bdab4138b6a88/public/figranium_icon.svg',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['activepieces'],
  actions: [
    executeTaskAction,
    listTasksAction,
    listExecutionsAction,
    listSchedulesAction,
    getScheduleStatusAction,
    getSchedulerStatusAction,
    setScheduleAction,
    deleteScheduleAction,
    describeScheduleAction,
    createCustomApiCallAction({
      auth: figraniumAuth,
      baseUrl: (auth) => (auth ? auth.props.baseUrl : ''),
      authMapping: async (auth) => ({
        'x-api-key': auth.props.apiKey,
      }),
    }),
  ],
  triggers: [],
});

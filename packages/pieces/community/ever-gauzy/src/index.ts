import { createPiece, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createEmployee, deleteEmployee, updateEmployee, getEmployee, listEmployees } from './lib/actions/employee';
import { startTimer, stopTimer, getTimerStatus } from './lib/actions/timer';
import { newTimeTrack, newTask, newEmployee } from './lib/triggers';
import { createTask, deleteTask, updateTask, getTask, getListOfTasks } from './lib/actions/tasks';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { gauzyAuth, getBaseUrl } from './lib/common/auth';

export const everGauzy = createPiece({
  displayName: 'Ever Gauzy',
  auth: gauzyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/ever-gauzy.png',
  categories: [
    PieceCategory.PRODUCTIVITY,
    PieceCategory.HUMAN_RESOURCES,
  ],
  description: 'Ever Gauzy is a powerful open-source business management platform that helps you manage your projects, teams, and clients effectively. Automate employee management, time tracking, task management, and more.',
  authors: ['Ever CO. LTD'],
  actions: [
    // Employee Actions
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee,
    listEmployees,

    // Timer Actions
    startTimer,
    stopTimer,
    getTimerStatus,

    // Task Actions
    createTask,
    updateTask,
    deleteTask,
    getTask,
    getListOfTasks,
    
    // Custom API Call
    createCustomApiCallAction({
      baseUrl: (auth) => {
        return getBaseUrl(auth as OAuth2PropertyValue);
      },
      auth: gauzyAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        'Content-Type': 'application/json',
      }),
    }),
  ],
  triggers: [newTimeTrack, newTask, newEmployee],
});

import { createPiece, PieceAuth, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { OAuth2GrantType, PieceCategory } from "@activepieces/shared";
import { createEmployee, deleteEmployee, updateEmployee, getEmployee, listEmployees } from './lib/actions/employee';
import { startTimer, stopTimer, getTimerStatus } from "./lib/actions/timer";
import { newTimeTrack, newTask, newEmployee } from "./lib/triggers";
import { createTask, deleteTask, updateTask, getTask, getListOfTasks } from "./lib/actions/tasks";
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const gauzyAuth = PieceAuth.OAuth2({
  required: true,
  grantType: OAuth2GrantType.AUTHORIZATION_CODE,
  authUrl: 'https://api.gauzy.co/api/auth/auth0',
  tokenUrl: 'https://auth.gauzy.co/api/oauth/token',
  scope: ['gauzy:all'],
});

export const everGauzy = createPiece({
  displayName: "Ever-gauzy",
  auth: gauzyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/ever-gauzy.png",
  categories: [
    PieceCategory.PRODUCTIVITY,
    PieceCategory.HUMAN_RESOURCES,
  ],
  description: "Ever Gauzy is a powerful open-source business management platform that helps you manage your projects, teams, and clients effectively. Automate employee management, time tracking, task management, and more.",
  authors: ["RolandM"],
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
        const authObj = auth as OAuth2PropertyValue;
        return authObj.props?.["baseUrl"] as string || 'https://api.gauzy.co';
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

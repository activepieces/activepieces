import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

import { cloneTask } from './lib/actions/clone-task';
import { completeTask } from './lib/actions/complete-task';
import { createAdmin } from './lib/actions/create-admin';
import { createDestination } from './lib/actions/create-destination';
import { createHub } from './lib/actions/create-hub';
import { createRecipient } from './lib/actions/create-recipient';
import { createTask } from './lib/actions/create-task';
import { createTeam } from './lib/actions/create-team';
import { createWorker } from './lib/actions/create-worker';
import { deleteAdmin } from './lib/actions/delete-admin';
import { deleteTask } from './lib/actions/delete-task';
import { deleteTeam } from './lib/actions/delete-team';
import { deleteWorker } from './lib/actions/delete-worker';
import { getAdmins } from './lib/actions/get-admins';
import { getContainer } from './lib/actions/get-container';
import { getDelegateeDetails } from './lib/actions/get-delegatee-details';
import { getDestination } from './lib/actions/get-destination';
import { getHubs } from './lib/actions/get-hubs';
import { getOrganization } from './lib/actions/get-organization';
import { getRecipient } from './lib/actions/get-recipient';
import { getTask } from './lib/actions/get-task';
import { getTasks } from './lib/actions/get-tasks';
import { getTeam } from './lib/actions/get-team';
import { getTeams } from './lib/actions/get-teams';
import { getWorker } from './lib/actions/get-worker';
import { getWorkerSchedule } from './lib/actions/get-worker-schedule';
import { updateAdmin } from './lib/actions/update-admin';
import { updateHub } from './lib/actions/update-hub';
import { updateRecipient } from './lib/actions/update-recipient';
import { updateTask } from './lib/actions/update-task';
import { updateTeam } from './lib/actions/update-team';
import { updateWorker } from './lib/actions/update-worker';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { autoDispatchCompleted } from './lib/triggers/auto-dispatch-completed';
import { smsRecipientOptOut } from './lib/triggers/sms-recipient-opt-out';
import { smsRecipientResponseMissed } from './lib/triggers/sms-recipient-response-missed';
import { taskArrival } from './lib/triggers/task-arrival';
import { taskAssigned } from './lib/triggers/task-assigned';
import { taskCloned } from './lib/triggers/task-cloned';
import { taskCompleted } from './lib/triggers/task-completed';
import { taskCreated } from './lib/triggers/task-created';
import { taskDelayed } from './lib/triggers/task-delayed';
import { taskDeleted } from './lib/triggers/task-deleted';
import { taskEta } from './lib/triggers/task-eta';
import { taskFailed } from './lib/triggers/task-failed';
import { taskStarted } from './lib/triggers/task-started';
import { taskUnassigned } from './lib/triggers/task-unassigned';
import { taskUpdated } from './lib/triggers/task-updated';
import { workerCreated } from './lib/triggers/worker-created';
import { workerDeleted } from './lib/triggers/worker-deleted';
import { workerDutyChange } from './lib/triggers/worker-duty-change';

const authDescription = `
To get an API key, follow the steps below:
1. Go to settings -> API & Webhooks.
2. Click the plus sign under API Keys.
3. Enter API key name and click create key.
4. Copy the generated key to the input below.
`;
export const onfleetAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: authDescription,
  required: true,
});

export const onfleet = createPiece({
  displayName: 'Onfleet',
  description: 'Last mile delivery software',

  auth: onfleetAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/onfleet.png',
  categories: [],
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  actions: [
    createRecipient,
    updateRecipient,
    getRecipient,
    createTask,
    deleteTask,
    completeTask,
    cloneTask,
    updateTask,
    getTask,
    getTasks,
    createDestination,
    getDestination,
    getHubs,
    createHub,
    updateHub,
    getOrganization,
    getDelegateeDetails,
    createAdmin,
    updateAdmin,
    getAdmins,
    deleteAdmin,
    createWorker,
    deleteWorker,
    getWorker,
    getWorkerSchedule,
    updateWorker,
    createTeam,
    deleteTeam,
    getTeam,
    getTeams,
    updateTeam,
    getContainer,
    createCustomApiCallAction({
      baseUrl: () => 'https://onfleet.com/api/v2',
      auth: onfleetAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [
    taskArrival,
    taskAssigned,
    taskCloned,
    taskCompleted,
    taskCreated,
    taskDelayed,
    taskDeleted,
    taskEta,
    taskFailed,
    taskStarted,
    taskUnassigned,
    taskUpdated,
    workerCreated,
    workerDeleted,
    workerDutyChange,
    autoDispatchCompleted,
    smsRecipientOptOut,
    smsRecipientResponseMissed,
  ],
});

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { microsoft365PlannerAiActions } from './lib/actions/ai';
import { createBucketAction } from './lib/actions/create-bucket';
import { createPlanAction } from './lib/actions/create-plan';
import { createTaskAction } from './lib/actions/create-task';
import { deleteBucketAction } from './lib/actions/delete-bucket';
import { deleteTaskAction } from './lib/actions/delete-task';
import { findAPlanAction } from './lib/actions/find-a-plan';
import { findTaskAction } from './lib/actions/find-task';
import { getABucketAction } from './lib/actions/get-a-bucket';
import { updateBucketAction } from './lib/actions/update-bucket';
import { updatePlanAction } from './lib/actions/update-plan';
import { updateTaskAction } from './lib/actions/update-task';
import { microsoft365PlannerAuth } from './lib/auth';
import { microsoft365PlannerClient } from './lib/common/client';
import { newPlanCreatedTrigger } from './lib/triggers/new-plan-created';
import { newTaskAssignedToUserTrigger } from './lib/triggers/new-task-assigned-to-user';
import { newTaskCreatedTrigger } from './lib/triggers/new-task-created';

export const microsoft365Planner = createPiece({
  displayName: 'Microsoft 365 Planner',
  description:
    'Microsoft 365 Planner is part of the Microsoft 365 suite, offering lightweight task and bucket-based planning for teams. This integration supports creating plans, buckets, tasks, fetching them, deleting them, and custom API calls.',
  auth: microsoft365PlannerAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-365-planner.png',
  authors: ['LuizDMM', 'sanket-a11y'],
  actions: [
    createPlanAction,
    createBucketAction,
    createTaskAction,
    deleteBucketAction,
    deleteTaskAction,
    updatePlanAction,
    updateBucketAction,
    updateTaskAction,
    findAPlanAction,
    getABucketAction,
    findTaskAction,
    ...microsoft365PlannerAiActions,
    createCustomApiCallAction({
      auth: microsoft365PlannerAuth,
      baseUrl: (auth) =>
        auth ? `${microsoft365PlannerClient.baseUrl({ auth })}/v1.0/` : '',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [
    newPlanCreatedTrigger,
    newTaskCreatedTrigger,
    newTaskAssignedToUserTrigger,
  ],
});

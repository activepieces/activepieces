import { createPiece, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { createBucket } from './lib/actions/create-bucket';
import { createPlan } from './lib/actions/create-plan';
import { createTask } from './lib/actions/create-task';
import { deleteBucket } from './lib/actions/delete-bucket';
import { deleteTask } from './lib/actions/delete-task';
import { findAPlan } from './lib/actions/find-a-plan';
import { findTask } from './lib/actions/find-task';
import { getABucket } from './lib/actions/get-a-bucket';
import { updateBucket } from './lib/actions/update-bucket';
import { updatePlan } from './lib/actions/update-plan';
import { updateTask } from './lib/actions/update-task';
import { microsoft365PlannerAuth } from './lib/common';
import { newPlanCreated } from './lib/triggers/new-plan-created';
import { newTaskAssignedToUser } from './lib/triggers/new-task-assigned-to-user';
import { newTaskCreated } from './lib/triggers/new-task-created';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const microsoft365Planner = createPiece({
  displayName: 'Microsoft 365 Planner',
  description:
    'Microsoft 365 Planner is part of the Microsoft 365 suite, offering lightweight task and bucket-based planning for teams. This integration supports creating plans, buckets, tasks, fetching them, deleting them, and custom API calls.',
  auth: microsoft365PlannerAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-365-planner.png',
  authors: ['LuizDMM','sanket-a11y'],
  actions: [
    // Write Actions
    createPlan,
    createBucket,
    createTask,
    deleteBucket,
    deleteTask,
    updatePlan,
    updateBucket,
    updateTask,
    // Search Actions
    findAPlan,
    getABucket,
    findTask,
    createCustomApiCallAction({
			auth: microsoft365PlannerAuth,
			baseUrl: () => 'https://graph.microsoft.com/v1.0/',
			authMapping: async (auth) => ({
				Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
			}),
		}),
  ],
  triggers: [
    newPlanCreated,
    newTaskCreated,
    newTaskAssignedToUser,
  ],
});

import { assignTaskAction } from './assign-task';
import { completeTaskAction } from './complete-task';
import { createBucketAiAction } from './create-bucket';
import { createPlanAiAction } from './create-plan';
import { createTaskAiAction } from './create-task';
import { deleteBucketAiAction } from './delete-bucket';
import { deletePlanAction } from './delete-plan';
import { deleteTaskAiAction } from './delete-task';
import { getBucketAction } from './get-bucket';
import { getCurrentUserAction } from './get-current-user';
import { getPlanAction } from './get-plan';
import { getPlanDetailsAction } from './get-plan-details';
import { getTaskAction } from './get-task';
import { getTaskDetailsAction } from './get-task-details';
import { listBucketTasksAction } from './list-bucket-tasks';
import { listBucketsAction } from './list-buckets';
import { listGroupMembersAction } from './list-group-members';
import { listGroupsAction } from './list-groups';
import { listMyTasksAction } from './list-my-tasks';
import { listPlanTasksAction } from './list-plan-tasks';
import { listPlansAction } from './list-plans';
import { listUsersAction } from './list-users';
import { moveTaskAction } from './move-task';
import { updateBucketAiAction } from './update-bucket';
import { updatePlanAiAction } from './update-plan';
import { updatePlanDetailsAction } from './update-plan-details';
import { updateTaskAiAction } from './update-task';
import { updateTaskDetailsAction } from './update-task-details';

export const microsoft365PlannerAiActions = [
  listPlansAction,
  getPlanAction,
  createPlanAiAction,
  updatePlanAiAction,
  deletePlanAction,
  getPlanDetailsAction,
  updatePlanDetailsAction,
  listBucketsAction,
  getBucketAction,
  createBucketAiAction,
  updateBucketAiAction,
  deleteBucketAiAction,
  listPlanTasksAction,
  listBucketTasksAction,
  listMyTasksAction,
  getTaskAction,
  createTaskAiAction,
  updateTaskAiAction,
  completeTaskAction,
  assignTaskAction,
  moveTaskAction,
  deleteTaskAiAction,
  getTaskDetailsAction,
  updateTaskDetailsAction,
  getCurrentUserAction,
  listGroupsAction,
  listGroupMembersAction,
  listUsersAction,
];

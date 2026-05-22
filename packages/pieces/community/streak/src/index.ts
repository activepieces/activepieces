import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { streakAuth } from './lib/common/auth';
import { createBoxAction } from './lib/actions/create-box';
import { createCommentAction } from './lib/actions/create-comment';
import { createContactAction } from './lib/actions/create-contact';
import { createOrganizationAction } from './lib/actions/create-organization';
import { createStageAction } from './lib/actions/create-stage';
import { createTaskAction } from './lib/actions/create-task';
import { findBoxAction } from './lib/actions/find-box';
import { getBoxAction } from './lib/actions/get-box';
import { getCurrentUserAction } from './lib/actions/get-current-user';
import { updateBoxAction } from './lib/actions/update-box';
import { STREAK_BASE_URL } from './lib/common/client';
import { boxPipelineChangedTrigger } from './lib/triggers/box-pipeline-changed';
import { boxStageChangedTrigger } from './lib/triggers/box-stage-changed';
import { newBoxTrigger } from './lib/triggers/new-box';
import { newCommentTrigger } from './lib/triggers/new-comment';
import { newContactTrigger } from './lib/triggers/new-contact';
import { newMeetingTrigger } from './lib/triggers/new-meeting';
import { newTaskTrigger } from './lib/triggers/new-task';
import { taskCompletedTrigger } from './lib/triggers/task-completed';
import { taskDueTrigger } from './lib/triggers/task-due';
import { updatedBoxTrigger } from './lib/triggers/updated-box';
import { updatedContactTrigger } from './lib/triggers/updated-contact';

export const streak = createPiece({
  displayName: 'Streak',
  description:
    'CRM built into Gmail. Manage pipelines, boxes, tasks, comments, contacts and organizations from your flows.',
  auth: streakAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/streak.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ['sanket-a11y'],
  actions: [
    createBoxAction,
    updateBoxAction,
    getBoxAction,
    findBoxAction,
    createStageAction,
    createTaskAction,
    createCommentAction,
    createContactAction,
    createOrganizationAction,
    getCurrentUserAction,
    createCustomApiCallAction({
      baseUrl: () => STREAK_BASE_URL,
      auth: streakAuth,
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(`${auth.secret_text}:`).toString('base64')}`,
      }),
    }),
  ],
  triggers: [
    newBoxTrigger,
    updatedBoxTrigger,
    boxStageChangedTrigger,
    boxPipelineChangedTrigger,
    newCommentTrigger,
    newTaskTrigger,
    taskCompletedTrigger,
    taskDueTrigger,
    newMeetingTrigger,
    newContactTrigger,
    updatedContactTrigger,
  ],
});

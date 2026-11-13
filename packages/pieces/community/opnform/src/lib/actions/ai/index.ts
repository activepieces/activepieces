import { opnformCreateFormAction } from './forms/create-form';
import { opnformDeleteFormAction } from './forms/delete-form';
import { opnformGetFormAction } from './forms/get-form';
import { opnformListFormsAction } from './forms/list-forms';
import { opnformUpdateFormAction } from './forms/update-form';
import { opnformCreateSubmissionAction } from './submissions/create-submission';
import { opnformDeleteSubmissionAction } from './submissions/delete-submission';
import { opnformExportSubmissionsAction } from './submissions/export-submissions';
import { opnformListSubmissionsAction } from './submissions/list-submissions';
import { opnformUpdateSubmissionAction } from './submissions/update-submission';
import { opnformListWorkspaceInvitesAction } from './workspace-users/list-workspace-invites';
import { opnformListWorkspaceUsersAction } from './workspace-users/list-workspace-users';
import { opnformUpdateWorkspaceUserRoleAction } from './workspace-users/update-workspace-user-role';
import { opnformGetCurrentUserAction } from './workspaces/get-current-user';
import { opnformListWorkspacesAction } from './workspaces/list-workspaces';
import { opnformUpdateWorkspaceAction } from './workspaces/update-workspace';

export const opnformAiActions = [
	opnformGetCurrentUserAction,
	opnformListWorkspacesAction,
	opnformUpdateWorkspaceAction,
	opnformListWorkspaceUsersAction,
	opnformUpdateWorkspaceUserRoleAction,
	opnformListWorkspaceInvitesAction,
	opnformListFormsAction,
	opnformGetFormAction,
	opnformCreateFormAction,
	opnformUpdateFormAction,
	opnformDeleteFormAction,
	opnformListSubmissionsAction,
	opnformCreateSubmissionAction,
	opnformUpdateSubmissionAction,
	opnformDeleteSubmissionAction,
	opnformExportSubmissionsAction,
];

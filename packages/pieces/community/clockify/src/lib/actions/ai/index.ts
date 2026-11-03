import { addUserRoleAction } from './add-user-role';
import { addUserToGroupAction } from './add-user-to-group';
import { assignProjectUsersAction } from './assign-project-users';
import { bulkDeleteTimeEntriesAction } from './bulk-delete-time-entries';
import { bulkUpdateTimeEntriesAction } from './bulk-update-time-entries';
import { createClientAction } from './create-client';
import { createHolidayAction } from './create-holiday';
import { createProjectAction } from './create-project';
import { createProjectFromTemplateAction } from './create-project-from-template';
import { createSharedReportAction } from './create-shared-report';
import { createTagAction } from './create-tag';
import { createTaskAiAction } from './create-task';
import { createTemplateAction } from './create-template';
import { createTimeEntryAiAction } from './create-time-entry';
import { createUserGroupAction } from './create-user-group';
import { createUserTimeEntryAction } from './create-user-time-entry';
import { createWorkspaceAction } from './create-workspace';
import { deleteClientAction } from './delete-client';
import { deleteHolidayAction } from './delete-holiday';
import { deleteProjectAction } from './delete-project';
import { deleteSharedReportAction } from './delete-shared-report';
import { deleteTagAction } from './delete-tag';
import { deleteTaskAction } from './delete-task';
import { deleteTemplateAction } from './delete-template';
import { deleteTimeEntryAction } from './delete-time-entry';
import { deleteUserGroupAction } from './delete-user-group';
import { duplicateTimeEntryAction } from './duplicate-time-entry';
import { generateAttendanceReportAction } from './generate-attendance-report';
import { generateDetailedReportAction } from './generate-detailed-report';
import { generateExpenseReportAction } from './generate-expense-report';
import { generateSummaryReportAction } from './generate-summary-report';
import { generateWeeklyReportAction } from './generate-weekly-report';
import { getClientAction } from './get-client';
import { getCurrentUserAction } from './get-current-user';
import { getMemberProfileAction } from './get-member-profile';
import { getProjectAction } from './get-project';
import { getSharedReportAction } from './get-shared-report';
import { getTagAction } from './get-tag';
import { getTaskAction } from './get-task';
import { getTemplateAction } from './get-template';
import { getTimeEntriesByIdsAction } from './get-time-entries-by-ids';
import { getTimeEntryAction } from './get-time-entry';
import { getWorkspaceAction } from './get-workspace';
import { listAssignmentsAction } from './list-assignments';
import { listClientsAction } from './list-clients';
import { listCreatedEntitiesAction } from './list-created-entities';
import { listCustomFieldsAction } from './list-custom-fields';
import { listHolidaysAction } from './list-holidays';
import { listHolidaysInPeriodAction } from './list-holidays-in-period';
import { listProjectCustomFieldsAction } from './list-project-custom-fields';
import { listProjectsAction } from './list-projects';
import { listRunningTimeEntriesAction } from './list-running-time-entries';
import { listSharedReportsAction } from './list-shared-reports';
import { listTagsAction } from './list-tags';
import { listTasksAction } from './list-tasks';
import { listTemplatesAction } from './list-templates';
import { listTimeEntriesAction } from './list-time-entries';
import { listUserGroupsAction } from './list-user-groups';
import { listUserManagersAction } from './list-user-managers';
import { listUsersAction } from './list-users';
import { listWorkspacesAction } from './list-workspaces';
import { markTimeEntriesInvoicedAction } from './mark-time-entries-invoiced';
import { removeUserFromGroupAction } from './remove-user-from-group';
import { removeUserRoleAction } from './remove-user-role';
import { startTimerAiAction } from './start-timer';
import { stopTimerAiAction } from './stop-timer';
import { updateClientAction } from './update-client';
import { updateHolidayAction } from './update-holiday';
import { updateMemberProfileAction } from './update-member-profile';
import { updateProjectAction } from './update-project';
import { updateProjectEstimateAction } from './update-project-estimate';
import { updateProjectMembershipsAction } from './update-project-memberships';
import { updateProjectTemplateAction } from './update-project-template';
import { updateProjectUserBillableRateAction } from './update-project-user-billable-rate';
import { updateProjectUserCostRateAction } from './update-project-user-cost-rate';
import { updateSharedReportAction } from './update-shared-report';
import { updateTagAction } from './update-tag';
import { updateTaskAction } from './update-task';
import { updateTaskBillableRateAction } from './update-task-billable-rate';
import { updateTaskCostRateAction } from './update-task-cost-rate';
import { updateTemplateAction } from './update-template';
import { updateTimeEntryAction } from './update-time-entry';
import { updateUserBillableRateAction } from './update-user-billable-rate';
import { updateUserCostRateAction } from './update-user-cost-rate';
import { updateUserCustomFieldAction } from './update-user-custom-field';
import { updateUserGroupAction } from './update-user-group';
import { updateUserStatusAction } from './update-user-status';
import { updateWorkspaceBillableRateAction } from './update-workspace-billable-rate';
import { updateWorkspaceCostRateAction } from './update-workspace-cost-rate';

export const clockifyAiActions = [
	addUserRoleAction,
	addUserToGroupAction,
	assignProjectUsersAction,
	bulkDeleteTimeEntriesAction,
	bulkUpdateTimeEntriesAction,
	createClientAction,
	createHolidayAction,
	createProjectFromTemplateAction,
	createProjectAction,
	createSharedReportAction,
	createTagAction,
	createTaskAiAction,
	createTemplateAction,
	createTimeEntryAiAction,
	createUserGroupAction,
	createUserTimeEntryAction,
	createWorkspaceAction,
	deleteClientAction,
	deleteHolidayAction,
	deleteProjectAction,
	deleteSharedReportAction,
	deleteTagAction,
	deleteTaskAction,
	deleteTemplateAction,
	deleteTimeEntryAction,
	deleteUserGroupAction,
	duplicateTimeEntryAction,
	generateAttendanceReportAction,
	generateDetailedReportAction,
	generateExpenseReportAction,
	generateSummaryReportAction,
	generateWeeklyReportAction,
	getClientAction,
	getCurrentUserAction,
	getMemberProfileAction,
	getProjectAction,
	getSharedReportAction,
	getTagAction,
	getTaskAction,
	getTemplateAction,
	getTimeEntriesByIdsAction,
	getTimeEntryAction,
	getWorkspaceAction,
	listAssignmentsAction,
	listClientsAction,
	listCreatedEntitiesAction,
	listCustomFieldsAction,
	listHolidaysInPeriodAction,
	listHolidaysAction,
	listProjectCustomFieldsAction,
	listProjectsAction,
	listRunningTimeEntriesAction,
	listSharedReportsAction,
	listTagsAction,
	listTasksAction,
	listTemplatesAction,
	listTimeEntriesAction,
	listUserGroupsAction,
	listUserManagersAction,
	listUsersAction,
	listWorkspacesAction,
	markTimeEntriesInvoicedAction,
	removeUserFromGroupAction,
	removeUserRoleAction,
	startTimerAiAction,
	stopTimerAiAction,
	updateClientAction,
	updateHolidayAction,
	updateMemberProfileAction,
	updateProjectEstimateAction,
	updateProjectMembershipsAction,
	updateProjectTemplateAction,
	updateProjectUserBillableRateAction,
	updateProjectUserCostRateAction,
	updateProjectAction,
	updateSharedReportAction,
	updateTagAction,
	updateTaskBillableRateAction,
	updateTaskCostRateAction,
	updateTaskAction,
	updateTemplateAction,
	updateTimeEntryAction,
	updateUserBillableRateAction,
	updateUserCostRateAction,
	updateUserCustomFieldAction,
	updateUserGroupAction,
	updateUserStatusAction,
	updateWorkspaceBillableRateAction,
	updateWorkspaceCostRateAction,
];

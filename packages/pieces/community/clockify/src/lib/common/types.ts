import type { AppConnectionType } from '@activepieces/pieces-framework';

export type ClockifyAuthValue = { type: AppConnectionType.SECRET_TEXT; secret_text: string };

export type ClockifyUser = {
	id: string;
	email: string;
	name?: string;
	activeWorkspace?: string;
};
export type ClockifyWorkspace = {
	id: string;
	name: string;
	cakeOrganizationId?: string;
};
export type ClockifyProject = {
	id: string;
	name: string;
	clientId?: string;
	color?: string;
	note?: string;
	billable?: boolean;
	archived?: boolean;
	public?: boolean;
};
export type ClockifyTask = {
	id: string;
	name: string;
	projectId?: string;
	status?: string;
	assigneeIds?: string[];
	userGroupIds?: string[];
	estimate?: string;
	billable?: boolean;
	budgetEstimate?: number;
};
export type ClockifyTag = { id: string; name: string; archived?: boolean };
export type ClockifyTimeEntry = {
	id: string;
	description?: string;
	userId?: string;
	projectId?: string;
	taskId?: string;
	tagIds?: string[];
	billable?: boolean;
	type?: string;
	timeInterval?: { start: string; end?: string };
	customFieldValues?: { customFieldId: string; value?: unknown }[];
};
export type ClockifyWebhook = { id: string };
export type ClockifyMemberProfile = {
	email?: string;
	name?: string;
	weekStart?: string;
	workCapacity?: string;
};
export type ClockifyRole = { role: string; userId: string; workspaceId: string };
export type ClockifyUserCustomFieldValue = {
	customFieldId: string;
	userId: string;
	value?: unknown;
};
export type ClockifyUserGroup = { id: string; name: string; userIds?: string[] };
export type ClockifyClient = {
	id: string;
	name: string;
	email?: string;
	address?: string;
	note?: string;
	archived?: boolean;
	currencyId?: string;
	ccEmails?: string[];
};
export type ClockifyClientInput = Omit<ClockifyClient, 'id'>;
export type ClockifyProjectInput = {
	name: string;
	clientId?: string;
	color?: string;
	note?: string;
	billable?: boolean;
	archived?: boolean;
	isPublic?: boolean;
	hourlyRate?: { amount: number };
};
export type ClockifyTaskInput = Omit<ClockifyTask, 'id' | 'projectId'>;
export type ClockifyCustomField = { id: string; name: string; type?: string; status?: string };
export type ClockifyTimeEntryInput = {
	start: string;
	end?: string;
	description?: string;
	projectId?: string;
	taskId?: string;
	tagIds?: string[];
	billable?: boolean;
	type?: string;
	customFields?: { customFieldId: string; value?: unknown }[];
};
export type ClockifyEntityFilter = {
	ids: string[];
	contains: 'CONTAINS' | 'DOES_NOT_CONTAIN';
	status: 'ALL';
};
export type ClockifyReportRequest = {
	dateRangeStart: string;
	dateRangeEnd: string;
	exportType: 'JSON';
	projects?: ClockifyEntityFilter;
	users?: ClockifyEntityFilter;
	clients?: ClockifyEntityFilter;
	tags?: ClockifyEntityFilter;
	userGroups?: ClockifyEntityFilter;
	billable?: boolean;
	description?: string;
	timeZone?: string;
	detailedFilter?: { page: number; pageSize: number; sortColumn: string };
	summaryFilter?: { groups: string[] };
	weeklyFilter?: { group: string; subgroup: string };
	attendanceFilter?: { page: number; pageSize: number };
	page?: number;
	pageSize?: number;
};
export type ClockifyReport = { totals?: unknown[] };
export type ClockifySharedReport = {
	id: string;
	name: string;
	type?: string;
	isPublic?: boolean;
	fixedDate?: boolean;
	visibleToUsers?: string[];
	visibleToUserGroups?: string[];
};
export type ClockifySharedReportInput = {
	name: string;
	type: string;
	isPublic?: boolean;
	fixedDate?: boolean;
	visibleToUsers?: string[];
	visibleToUserGroups?: string[];
	filter: ClockifyReportRequest;
};
export type ClockifySharedReportUpdate = Omit<ClockifySharedReport, 'id' | 'type'>;
export type ClockifySharedReportListItem = Omit<
	ClockifySharedReport,
	'visibleToUsers' | 'visibleToUserGroups'
> & {
	visibleToUsers?: { id: string }[];
	visibleToUserGroups?: { id: string }[];
};
export type ClockifySharedReportPage = {
	count?: number;
	reports?: ClockifySharedReportListItem[];
};
export type ClockifyTemplate = { id: string; name: string };
export type ClockifyHoliday = {
	id: string;
	name: string;
	datePeriod: { startDate: string; endDate: string };
	occursAnnually?: boolean;
	everyoneIncludingNew?: boolean;
	userIds?: string[];
	userGroupIds?: string[];
	automaticTimeEntryCreation?: unknown;
};
export type ClockifyAssignment = { id: string; userId?: string; projectId?: string };

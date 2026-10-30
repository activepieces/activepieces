import { HttpMethod } from '@activepieces/pieces-common';

import { zohoDeskClient } from '../client';

import type { ZohoDeskAuthValue, ZohoDeskRecord } from '../types';

async function listTicketTimeEntries({
	auth,
	orgId,
	ticketId,
	billStatus,
	module,
	createdTimeRange,
	modifiedTimeRange,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	billStatus?: string;
	module?: string;
	createdTimeRange?: string;
	modifiedTimeRange?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/timeEntry`,
		query: { billStatus, module, createdTimeRange, modifiedTimeRange, from, limit },
	});
}

async function addTicketTimeEntry({
	auth,
	orgId,
	ticketId,
	executedTime,
	hoursSpent,
	minutesSpent,
	secondsSpent,
	description,
	ownerId,
	isBillable,
	requestChargeType,
	additionalCost,
	customFields,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	executedTime: string;
	hoursSpent?: number;
	minutesSpent?: number;
	secondsSpent?: number;
	description?: string;
	ownerId?: string;
	isBillable?: boolean;
	requestChargeType?: string;
	additionalCost?: number;
	customFields?: Record<string, unknown>;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/${encodeURIComponent(ticketId)}/timeEntry`,
		body: {
			executedTime,
			hoursSpent,
			minutesSpent,
			secondsSpent,
			description,
			ownerId,
			isBillable,
			requestChargeType,
			additionalCost,
			cf: customFields,
		},
	});
}

async function getTicketTimeEntry({
	auth,
	orgId,
	ticketId,
	timeEntryId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	timeEntryId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/timeEntry/${encodeURIComponent(timeEntryId)}`,
	});
}

async function updateTicketTimeEntry({
	auth,
	orgId,
	ticketId,
	timeEntryId,
	customFields,
	...fields
}: TimeEntryFields & {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	timeEntryId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PUT,
		path: `/tickets/${encodeURIComponent(ticketId)}/timeEntry/${encodeURIComponent(timeEntryId)}`,
		body: { ...fields, cf: customFields },
	});
}

async function deleteTicketTimeEntry({
	auth,
	orgId,
	ticketId,
	timeEntryId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	timeEntryId: string;
}): Promise<void> {
	await zohoDeskClient.request<unknown>({
		auth,
		orgId,
		method: HttpMethod.DELETE,
		path: `/tickets/${encodeURIComponent(ticketId)}/timeEntry/${encodeURIComponent(timeEntryId)}`,
	});
}

async function listTicketTimeEntriesByBillingType({
	auth,
	orgId,
	ticketId,
	billingType,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	billingType: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/timeEntryByBillingType`,
		query: { billingType, from, limit },
	});
}

async function getTicketTimeSummary({
	auth,
	orgId,
	ticketId,
	module,
	billStatus,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	module?: string;
	billStatus?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/timeEntrySummation`,
		query: { module, billStatus },
	});
}

async function getTicketTimer({
	auth,
	orgId,
	ticketId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/timer`,
	});
}

async function controlTicketTimer({
	auth,
	orgId,
	ticketId,
	action,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	action: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tickets/${encodeURIComponent(ticketId)}/timer`,
		query: { action },
	});
}

async function listTicketActiveTimers({
	auth,
	orgId,
	ticketId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	ticketId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tickets/${encodeURIComponent(ticketId)}/activeTimer`,
		query: { from, limit },
	});
}

async function listTaskTimeEntries({
	auth,
	orgId,
	taskId,
	billStatus,
	createdTimeRange,
	modifiedTimeRange,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskId: string;
	billStatus?: string;
	createdTimeRange?: string;
	modifiedTimeRange?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tasks/${encodeURIComponent(taskId)}/timeEntry`,
		query: { billStatus, createdTimeRange, modifiedTimeRange, from, limit },
	});
}

async function addTaskTimeEntry({
	auth,
	orgId,
	taskId,
	executedTime,
	hoursSpent,
	minutesSpent,
	secondsSpent,
	description,
	ownerId,
	isBillable,
	requestChargeType,
	additionalCost,
	customFields,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskId: string;
	executedTime: string;
	hoursSpent?: number;
	minutesSpent?: number;
	secondsSpent?: number;
	description?: string;
	ownerId?: string;
	isBillable?: boolean;
	requestChargeType?: string;
	additionalCost?: number;
	customFields?: Record<string, unknown>;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tasks/${encodeURIComponent(taskId)}/timeEntry`,
		body: {
			executedTime,
			hoursSpent,
			minutesSpent,
			secondsSpent,
			description,
			ownerId,
			isBillable,
			requestChargeType,
			additionalCost,
			cf: customFields,
		},
	});
}

async function getTaskTimeEntry({
	auth,
	orgId,
	taskId,
	timeEntryId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskId: string;
	timeEntryId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tasks/${encodeURIComponent(taskId)}/timeEntry/${encodeURIComponent(timeEntryId)}`,
	});
}

async function updateTaskTimeEntry({
	auth,
	orgId,
	taskId,
	timeEntryId,
	executedTime,
	hoursSpent,
	minutesSpent,
	secondsSpent,
	description,
	ownerId,
	isBillable,
	requestChargeType,
	additionalCost,
	customFields,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskId: string;
	timeEntryId: string;
	executedTime?: string;
	hoursSpent?: number;
	minutesSpent?: number;
	secondsSpent?: number;
	description?: string;
	ownerId?: string;
	isBillable?: boolean;
	requestChargeType?: string;
	additionalCost?: number;
	customFields?: Record<string, unknown>;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.PATCH,
		path: `/tasks/${encodeURIComponent(taskId)}/timeEntry/${encodeURIComponent(timeEntryId)}`,
		body: {
			executedTime,
			hoursSpent,
			minutesSpent,
			secondsSpent,
			description,
			ownerId,
			isBillable,
			requestChargeType,
			additionalCost,
			cf: customFields,
		},
	});
}

async function getTaskTimeSummary({
	auth,
	orgId,
	taskId,
	billStatus,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskId: string;
	billStatus?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tasks/${encodeURIComponent(taskId)}/timeEntrySummation`,
		query: { billStatus },
	});
}

async function getTaskTimer({
	auth,
	orgId,
	taskId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tasks/${encodeURIComponent(taskId)}/timer`,
	});
}

async function controlTaskTimer({
	auth,
	orgId,
	taskId,
	action,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskId: string;
	action: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path: `/tasks/${encodeURIComponent(taskId)}/timer`,
		query: { action },
	});
}

async function listTaskActiveTimers({
	auth,
	orgId,
	taskId,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	taskId: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/tasks/${encodeURIComponent(taskId)}/activeTimer`,
		query: { from, limit },
	});
}

async function listContactTimeEntries({
	auth,
	orgId,
	contactId,
	module,
	departmentId,
	billStatus,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	module?: string;
	departmentId?: string;
	billStatus?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contacts/${encodeURIComponent(contactId)}/timeEntry`,
		query: { module, departmentId, billStatus, from, limit },
	});
}

async function getContactTimeSummary({
	auth,
	orgId,
	contactId,
	module,
	departmentId,
	billStatus,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	contactId: string;
	module?: string;
	departmentId?: string;
	billStatus?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/contacts/${encodeURIComponent(contactId)}/timeEntrySummation`,
		query: { module, departmentId, billStatus },
	});
}

async function listAccountTimeEntries({
	auth,
	orgId,
	accountId,
	module,
	departmentId,
	billStatus,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	module?: string;
	departmentId?: string;
	billStatus?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/accounts/${encodeURIComponent(accountId)}/timeEntry`,
		query: { module, departmentId, billStatus, from, limit },
	});
}

async function getAccountTimeSummary({
	auth,
	orgId,
	accountId,
	module,
	departmentId,
	billStatus,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	accountId: string;
	module?: string;
	departmentId?: string;
	billStatus?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/accounts/${encodeURIComponent(accountId)}/timeEntrySummation`,
		query: { module, departmentId, billStatus },
	});
}

async function listAgentTimeEntries({
	auth,
	orgId,
	agentId,
	module,
	departmentId,
	billStatus,
	from,
	limit,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	agentId: string;
	module?: string;
	departmentId?: string;
	billStatus?: string;
	from?: number;
	limit?: number;
}): Promise<ZohoDeskRecord[]> {
	return await zohoDeskClient.list<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/agents/${encodeURIComponent(agentId)}/timeEntry`,
		query: { module, departmentId, billStatus, from, limit },
	});
}

async function getAgentTimeEntry({
	auth,
	orgId,
	agentId,
	timeEntryId,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	agentId: string;
	timeEntryId: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/agents/${encodeURIComponent(agentId)}/timeEntry/${encodeURIComponent(timeEntryId)}`,
	});
}

async function getAgentTimeSummary({
	auth,
	orgId,
	agentId,
	module,
	departmentId,
	billStatus,
}: {
	auth: ZohoDeskAuthValue;
	orgId: string;
	agentId: string;
	module?: string;
	departmentId?: string;
	billStatus?: string;
}): Promise<ZohoDeskRecord> {
	return await zohoDeskClient.request<ZohoDeskRecord>({
		auth,
		orgId,
		method: HttpMethod.GET,
		path: `/agents/${encodeURIComponent(agentId)}/timeEntrySummation`,
		query: { module, departmentId, billStatus },
	});
}

export const zohoDeskTimeTrackingApi = {
	listTicketTimeEntries,
	addTicketTimeEntry,
	getTicketTimeEntry,
	updateTicketTimeEntry,
	deleteTicketTimeEntry,
	listTicketTimeEntriesByBillingType,
	getTicketTimeSummary,
	getTicketTimer,
	controlTicketTimer,
	listTicketActiveTimers,
	listTaskTimeEntries,
	addTaskTimeEntry,
	getTaskTimeEntry,
	updateTaskTimeEntry,
	getTaskTimeSummary,
	getTaskTimer,
	controlTaskTimer,
	listTaskActiveTimers,
	listContactTimeEntries,
	getContactTimeSummary,
	listAccountTimeEntries,
	getAccountTimeSummary,
	listAgentTimeEntries,
	getAgentTimeEntry,
	getAgentTimeSummary,
};

type TimeEntryFields = {
	executedTime?: string;
	hoursSpent?: number;
	minutesSpent?: number;
	secondsSpent?: number;
	description?: string;
	ownerId?: string;
	isBillable?: boolean;
	requestChargeType?: string;
	additionalCost?: number;
	customFields?: Record<string, unknown>;
};

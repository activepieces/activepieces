import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createPiece } from '@activepieces/pieces-framework';

import { approveTaskAction } from './lib/actions/approve-task';
import { callOperationAction } from './lib/actions/call-operation';
import { changeJobAction } from './lib/actions/change-job';
import { createJobRequisitionAction } from './lib/actions/create-job-requisition';
import { createPreHireAction } from './lib/actions/create-pre-hire';
import { createSupplierCreditMemoAction } from './lib/actions/create-supplier-credit-memo';
import { createTimeOffRequestAction } from './lib/actions/create-time-off-request';
import { createUpdateCustomObjectAction } from './lib/actions/create-update-custom-object';
import { createWorkerTimeBlockAction } from './lib/actions/create-worker-time-block';
import { findPurchaseOrderAction } from './lib/actions/find-purchase-order';
import { findRecordsWqlAction } from './lib/actions/find-records-wql';
import { findSupplierAction } from './lib/actions/find-supplier';
import { findSupplierInvoiceAction } from './lib/actions/find-supplier-invoice';
import { findSupplierPaymentAction } from './lib/actions/find-supplier-payment';
import { getBusinessObjectDetailsBatchAction } from './lib/actions/get-business-object-details-batch';
import { getCustomObjectsAction } from './lib/actions/get-custom-objects';
import { getReportAction } from './lib/actions/get-report';
import { getReportWqlBatchAction } from './lib/actions/get-report-wql-batch';
import { hireEmployeeAction } from './lib/actions/hire-employee';
import { listCustomObjectDefinitionsBatchAction } from './lib/actions/list-custom-object-definitions-batch';
import { searchBusinessObjectBatchAction } from './lib/actions/search-business-object-batch';
import { updateBusinessObjectAction } from './lib/actions/update-business-object';
import { updateSupplierAction } from './lib/actions/update-supplier';
import { updateSupplierInvoiceAction } from './lib/actions/update-supplier-invoice';
import { workdayAuth } from './lib/auth';
import { workdayClient } from './lib/common/client';
import { businessProcessCompletedTrigger } from './lib/triggers/business-process-completed';
import { employeeTerminatedTrigger } from './lib/triggers/employee-terminated';
import { expenseReportSubmittedTrigger } from './lib/triggers/expense-report-submitted';
import { leaveRequestSubmittedTrigger } from './lib/triggers/leave-request-submitted';
import { newHireCreatedTrigger } from './lib/triggers/new-hire-created';
import { newInboxTaskTrigger } from './lib/triggers/new-inbox-task';
import { newOrUpdatedBusinessObjectTrigger } from './lib/triggers/new-or-updated-business-object';
import { newOrUpdatedBusinessObjectBatchTrigger } from './lib/triggers/new-or-updated-business-object-batch';
import { newSupplierTrigger } from './lib/triggers/new-supplier';
import { newSupplierInvoiceTrigger } from './lib/triggers/new-supplier-invoice';
import { runWqlQueryTrigger } from './lib/triggers/run-wql-query';
import { scheduledReportFetchBatchTrigger } from './lib/triggers/scheduled-report-fetch-batch';
import { scheduledReportFetchWqlBatchTrigger } from './lib/triggers/scheduled-report-fetch-wql-batch';
import { updatedSupplierTrigger } from './lib/triggers/updated-supplier';

export const workday = createPiece({
	displayName: 'Workday',
	description: 'Cloud-based enterprise platform for human resources, finance, and planning.',
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/workday.jpg',
	authors: [],
	categories: [PieceCategory.HUMAN_RESOURCES],
	auth: workdayAuth,
	actions: [
		approveTaskAction,
		changeJobAction,
		createJobRequisitionAction,
		createPreHireAction,
		createSupplierCreditMemoAction,
		createTimeOffRequestAction,
		createWorkerTimeBlockAction,
		findPurchaseOrderAction,
		findRecordsWqlAction,
		findSupplierAction,
		findSupplierInvoiceAction,
		findSupplierPaymentAction,
		hireEmployeeAction,
		updateSupplierAction,
		updateSupplierInvoiceAction,
		getBusinessObjectDetailsBatchAction,
		searchBusinessObjectBatchAction,
		updateBusinessObjectAction,
		callOperationAction,
		getCustomObjectsAction,
		getReportAction,
		getReportWqlBatchAction,
		listCustomObjectDefinitionsBatchAction,
		createUpdateCustomObjectAction,
		createCustomApiCallAction({
			baseUrl: (auth) => {
				if (!auth) {
					throw new Error('Connect Workday first.');
				}
				return workdayClient.baseUrl({ auth });
			},
			auth: workdayAuth,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${workdayClient.bearerToken({ auth })}`,
			}),
		}),
	],
	triggers: [
		businessProcessCompletedTrigger,
		employeeTerminatedTrigger,
		expenseReportSubmittedTrigger,
		leaveRequestSubmittedTrigger,
		newHireCreatedTrigger,
		newInboxTaskTrigger,
		newSupplierTrigger,
		newSupplierInvoiceTrigger,
		runWqlQueryTrigger,
		updatedSupplierTrigger,
		newOrUpdatedBusinessObjectTrigger,
		newOrUpdatedBusinessObjectBatchTrigger,
		scheduledReportFetchBatchTrigger,
		scheduledReportFetchWqlBatchTrigger,
	],
});

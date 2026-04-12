import {
	OAuth2PropertyValue,
	createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { workdayAuth } from './lib/auth';

import { approveTask } from './lib/action/approve-task';
import { changeJob } from './lib/action/change-job';
import { createJobRequisition } from './lib/action/create-job-requisition';
import { createPreHire } from './lib/action/create-pre-hire';
import { createSupplierCreditMemo } from './lib/action/create-supplier-credit-memo';
import { createTimeOffRequest } from './lib/action/create-time-off-request';
import { createWorkerTimeBlock } from './lib/action/create-worker-time-block';
import { findPurchaseOrder } from './lib/action/find-purchase-order';
import { findRecordsWql } from './lib/action/find-records-wql';
import { findSupplier } from './lib/action/find-supplier';
import { findSupplierInvoice } from './lib/action/find-supplier-invoice';
import { findSupplierPayment } from './lib/action/find-supplier-payment';
import { hireEmployee } from './lib/action/hire-employee';
import { updateSupplier } from './lib/action/update-supplier';
import { updateSupplierInvoice } from './lib/action/update-supplier-invoice';

import { businessProcessCompleted } from './lib/trigger/business-process-completed';
import { employeeTerminated } from './lib/trigger/employee-terminated';
import { expenseReportSubmitted } from './lib/trigger/expense-report-submitted';
import { leaveRequestSubmitted } from './lib/trigger/leave-request-submitted';
import { newHireCreated } from './lib/trigger/new-hire-created';
import { newInboxTask } from './lib/trigger/new-inbox-task';
import { newSupplier } from './lib/trigger/new-supplier';
import { newSupplierInvoice } from './lib/trigger/new-supplier-invoice';
import { runWqlQuery } from './lib/trigger/run-wql-query';
import { updatedSupplier } from './lib/trigger/updated-supplier';

export const workday = createPiece({
	displayName: 'Workday',
	description:
		'Cloud-based enterprise platform for human resources, finance, and planning.',
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/workday.jpg',
	authors: [],
	categories: [PieceCategory.HUMAN_RESOURCES],
	auth: workdayAuth,
	actions: [
		approveTask,
		changeJob,
		createJobRequisition,
		createPreHire,
		createSupplierCreditMemo,
		createTimeOffRequest,
		createWorkerTimeBlock,
		findPurchaseOrder,
		findRecordsWql,
		findSupplier,
		findSupplierInvoice,
		findSupplierPayment,
		hireEmployee,
		updateSupplier,
		updateSupplierInvoice,
		createCustomApiCallAction({
			baseUrl: (auth) =>
				`https://wd2-impl-services1.workday.com/ccx/api/v1/${(auth as OAuth2PropertyValue).props?.['tenant']}`,
			auth: workdayAuth,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
			}),
		}),
	],
	triggers: [
		businessProcessCompleted,
		employeeTerminated,
		expenseReportSubmitted,
		leaveRequestSubmitted,
		newHireCreated,
		newInboxTask,
		newSupplier,
		newSupplierInvoice,
		runWqlQuery,
		updatedSupplier,
	],
});

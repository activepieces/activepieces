import dayjs from 'dayjs';

import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { workdayClient } from './client';
import { workdayUtils } from './utils';

import type {
	WorkdayAuthValue,
	WorkdayBusinessObject,
	WorkdayPage,
	WorkdayRecord,
	WorkdayReport,
	WorkdayServerTimestampBody,
	WorkdaySoapGetPage,
	WorkdaySoapObject,
	WorkdaySupplierInvoicesBody,
} from './types';

async function getServerTimestamp({ auth }: { auth: WorkdayAuthValue }): Promise<WorkdayRecord> {
	return await workdayClient.soap({
		auth,
		service: 'Human_Resources',
		operationXml: '<bsvc:Server_Timestamp_Get xmlns:bsvc="urn:com.workday/bsvc"/>',
	});
}

async function listCustomObjectDefinitions({
	auth,
}: {
	auth: WorkdayAuthValue;
}): Promise<WorkdayRecord[]> {
	return await workdayClient.paginate<WorkdayRecord>({
		auth,
		path: '/definitions',
		service: 'customObjectDefinition/v1',
	});
}

async function getCustomObject({
	auth,
	alias,
	objectId,
}: {
	auth: WorkdayAuthValue;
	alias: string;
	objectId: string;
}): Promise<WorkdayRecord> {
	return await workdayClient.request<WorkdayRecord>({
		auth,
		method: HttpMethod.GET,
		path: `/customObjects/${encodeURIComponent(alias)}/${encodeURIComponent(objectId)}`,
	});
}

async function upsertCustomObject({
	auth,
	alias,
	objectId,
	body,
}: {
	auth: WorkdayAuthValue;
	alias: string;
	objectId?: string;
	body: WorkdayRecord;
}): Promise<WorkdayRecord> {
	const path = `/customObjects/${encodeURIComponent(alias)}`;
	if (objectId) {
		return await workdayClient.request<WorkdayRecord>({
			auth,
			method: HttpMethod.PUT,
			path: `${path}/${encodeURIComponent(objectId)}`,
			body,
		});
	}
	return await workdayClient.request<WorkdayRecord>({
		auth,
		method: HttpMethod.POST,
		path,
		body,
		query: { updateIfExists: 'true' },
	});
}

async function getBusinessObject({
	auth,
	businessObject,
	objectId,
}: {
	auth: WorkdayAuthValue;
	businessObject: WorkdayBusinessObject;
	objectId: string;
}): Promise<WorkdayRecord> {
	return await workdayClient.request<WorkdayRecord>({
		auth,
		method: HttpMethod.GET,
		path: `${businessObject.path}/${objectId}`,
		service: businessObject.service,
	});
}

async function searchBusinessObjects({
	auth,
	businessObject,
	query,
}: {
	auth: WorkdayAuthValue;
	businessObject: WorkdayBusinessObject;
	query: QueryParams;
}): Promise<WorkdayRecord[]> {
	return await workdayClient.paginate<WorkdayRecord>({
		auth,
		path: businessObject.path,
		query,
		service: businessObject.service,
	});
}

async function listBusinessObjects({
	auth,
	businessObject,
	query,
}: {
	auth: WorkdayAuthValue;
	businessObject: WorkdayBusinessObject;
	query: QueryParams;
}): Promise<WorkdayRecord[]> {
	const page = await workdayClient.request<WorkdayPage<WorkdayRecord>>({
		auth,
		method: HttpMethod.GET,
		path: businessObject.path,
		query,
		service: businessObject.service,
	});
	return page.data ?? [];
}

async function listSoapObjects({
	auth,
	object,
	ids,
	updatedFrom,
	updatedThrough,
	limit,
}: {
	auth: WorkdayAuthValue;
	object: WorkdaySoapObject;
	ids?: string[];
	updatedFrom?: string;
	updatedThrough?: string;
	limit?: number;
}): Promise<WorkdayRecord[]> {
	if (object.idsRequired && (!ids || ids.length === 0)) {
		throw new Error(
			`${object.label} can only be fetched by ID. Use Get Business Object Details.`,
		);
	}
	const first = await getSoapObjectsPage({
		auth,
		object,
		ids,
		updatedFrom,
		updatedThrough,
	});
	const lastPage = limit
		? Math.min(first.totalPages, Math.ceil(limit / SOAP_PAGE_SIZE))
		: first.totalPages;
	const rest = [];
	for (let page = 2; page <= lastPage; page++) {
		const next = await getSoapObjectsPage({
			auth,
			object,
			ids,
			updatedFrom,
			updatedThrough,
			page,
			asOfEntryDateTime: first.asOfEntryDateTime,
		});
		rest.push(...next.records);
	}
	const records = [...first.records, ...rest];
	return limit ? records.slice(0, limit) : records;
}

async function listChangedSoapObjects({
	auth,
	object,
	sinceEpochMS,
}: {
	auth: WorkdayAuthValue;
	object: WorkdaySoapObject;
	sinceEpochMS: number;
}): Promise<{ records: WorkdayRecord[]; updatedThroughEpochMS: number }> {
	if (!object.transactionLog) {
		throw new Error(`Workday does not track changes for ${object.label}, so it can't be watched.`);
	}
	const isTest = sinceEpochMS === 0;
	const updatedThrough = await getServerTime({ auth });
	const updatedFrom = isTest ? updatedThrough.subtract(7, 'day') : dayjs(sinceEpochMS);
	const records = await listSoapObjects({
		auth,
		object,
		updatedFrom: updatedFrom.toISOString(),
		updatedThrough: updatedThrough.toISOString(),
		limit: isTest ? 10 : undefined,
	});
	return {
		records,
		updatedThroughEpochMS: updatedThrough.valueOf(),
	};
}

async function getServerTime({ auth }: { auth: WorkdayAuthValue }): Promise<dayjs.Dayjs> {
	const body = await workdayClient.soap<WorkdayServerTimestampBody>({
		auth,
		service: 'Human_Resources',
		operationXml: '<bsvc:Server_Timestamp_Get xmlns:bsvc="urn:com.workday/bsvc"/>',
	});
	const serverTime = dayjs(body.Server_Timestamp?.Server_Timestamp_Data);
	if (!serverTime.isValid()) {
		throw new Error('Workday did not return its current time.');
	}
	return serverTime;
}

async function getSoapObjectsPage({
	auth,
	object,
	...request
}: {
	auth: WorkdayAuthValue;
	object: WorkdaySoapObject;
	ids?: string[];
	updatedFrom?: string;
	updatedThrough?: string;
	page?: number;
	asOfEntryDateTime?: string;
}): Promise<WorkdaySoapGetPage> {
	const body = await workdayClient.soap({
		auth,
		service: object.service,
		operationXml: workdayUtils.buildSoapGetRequest({ object, ...request }),
	});
	return workdayUtils.readSoapGetPage({ object, body });
}

async function updateBusinessObject({
	auth,
	businessObject,
	objectId,
	body,
}: {
	auth: WorkdayAuthValue;
	businessObject: WorkdayBusinessObject;
	objectId: string;
	body: unknown;
}): Promise<WorkdayRecord> {
	return await workdayClient.request<WorkdayRecord>({
		auth,
		method: HttpMethod.PUT,
		path: `${businessObject.path}/${objectId}`,
		body,
		service: businessObject.service,
	});
}

async function callRestOperation({
	auth,
	method,
	path,
	body,
	service,
}: {
	auth: WorkdayAuthValue;
	method: HttpMethod;
	path: string;
	body?: WorkdayRecord;
	service: string;
}): Promise<WorkdayRecord> {
	return await workdayClient.request<WorkdayRecord>({ auth, method, path, body, service });
}

async function callSoapOperation({
	auth,
	service,
	operationXml,
	version,
}: {
	auth: WorkdayAuthValue;
	service: string;
	operationXml: string;
	version?: string;
}): Promise<WorkdayRecord> {
	return await workdayClient.soap({ auth, service, operationXml, version });
}

async function runWql({
	auth,
	query,
}: {
	auth: WorkdayAuthValue;
	query: string;
}): Promise<WorkdayPage<WorkdayRecord>> {
	return await workdayClient.wql<WorkdayPage<WorkdayRecord>>({ auth, query });
}

async function runWqlAll({
	auth,
	query,
}: {
	auth: WorkdayAuthValue;
	query: string;
}): Promise<WorkdayRecord[]> {
	return await workdayClient.wqlAll<WorkdayRecord>({ auth, query });
}

async function findSupplier({
	auth,
	supplierId,
}: {
	auth: WorkdayAuthValue;
	supplierId: string;
}): Promise<WorkdayPage<WorkdayRecord>> {
	return await runWql({
		auth,
		query: `SELECT supplier, supplierName FROM suppliers WHERE supplier = '${escapeWql({
			value: supplierId,
		})}'`,
	});
}

async function findPurchaseOrder({
	auth,
	purchaseOrderId,
}: {
	auth: WorkdayAuthValue;
	purchaseOrderId: string;
}): Promise<WorkdayPage<WorkdayRecord>> {
	return await runWql({
		auth,
		query: `SELECT purchaseOrder FROM purchaseOrders(dataSourceFilter = purchaseOrdersFilter) WHERE purchaseOrder = '${escapeWql(
			{
				value: purchaseOrderId,
			},
		)}'`,
	});
}

async function findSupplierPayments({
	auth,
	supplierId,
	paymentId,
}: {
	auth: WorkdayAuthValue;
	supplierId?: string;
	paymentId?: string;
}): Promise<WorkdayPage<WorkdayRecord>> {
	const conditions: string[] = [];
	if (supplierId) conditions.push(`supplier = '${escapeWql({ value: supplierId })}'`);
	if (paymentId) conditions.push(`supplierPayment = '${escapeWql({ value: paymentId })}'`);

	const companies = await runWqlAll({ auth, query: 'SELECT company FROM companies' });
	const companyIds = companies
		.map((row) => workdayUtils.readNestedId({ value: row['company'] }))
		.filter((id): id is string => typeof id === 'string' && WID_PATTERN.test(id));
	if (companyIds.length === 0) {
		return { total: 0, data: [] };
	}

	const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
	return await runWql({
		auth,
		query: `SELECT supplierPayment FROM supplierPayments(dataSourceFilter = supplierPaymentsFilter, company = (${companyIds.join(
			', ',
		)}))${whereClause}`,
	});
}

async function listInboxTasks({ auth }: { auth: WorkdayAuthValue }): Promise<WorkdayRecord[]> {
	const page = await runWql({
		auth,
		query: `SELECT businessProcess FROM businessProcessTransactionsAwaitingMyAction LIMIT 100`,
	});
	return page.data ?? [];
}

async function listTerminations({
	auth,
	sinceEpochMS,
}: {
	auth: WorkdayAuthValue;
	sinceEpochMS: number;
}): Promise<WorkdayRecord[]> {
	const since = dayjs(sinceEpochMS).toISOString();
	const limit = sinceEpochMS === 0 ? ' LIMIT 10' : '';
	return await runWqlAll({
		auth,
		query: `SELECT worker, effectiveDate, primaryTerminationReason, dateAndTimeCompleted FROM terminations WHERE dateAndTimeCompleted > '${since}' ORDER BY dateAndTimeCompleted DESC${limit}`,
	});
}

async function listNewHires({
	auth,
	sinceEpochMS,
}: {
	auth: WorkdayAuthValue;
	sinceEpochMS: number;
}): Promise<WorkdayRecord[]> {
	const since = dayjs(sinceEpochMS).toISOString();
	const limit = sinceEpochMS === 0 ? ' LIMIT 10' : '';
	return await runWqlAll({
		auth,
		query: `SELECT worker, hireDate, createdMoment FROM allWorkers WHERE createdMoment > '${since}' ORDER BY createdMoment DESC${limit}`,
	});
}

async function listBusinessProcessTransactions({
	auth,
	momentField,
	sinceEpochMS,
	typeIds,
	completedOnly,
}: {
	auth: WorkdayAuthValue;
	momentField: 'dateAndTimeInitiated' | 'dateAndTimeCompleted';
	sinceEpochMS: number;
	typeIds?: string[];
	completedOnly?: boolean;
}): Promise<WorkdayRecord[]> {
	const conditions = [`${momentField} > '${new Date(sinceEpochMS).toISOString()}'`];
	if (typeIds && typeIds.length > 0) {
		conditions.push(
			`businessProcessType in (${typeIds.map((id) => `'${escapeWql({ value: id })}'`).join(', ')})`,
		);
	}
	if (completedOnly) {
		conditions.push(`status = 'Successfully Completed'`);
	}
	const limit = sinceEpochMS === 0 ? ' LIMIT 10' : '';
	return await runWqlAll({
		auth,
		query: `SELECT businessProcessEvent, businessProcessType, status, worker, subject, dateAndTimeInitiated, dateAndTimeCompleted FROM businessProcessTransactions WHERE ${conditions.join(
			' AND ',
		)} ORDER BY ${momentField} DESC${limit}`,
	});
}

async function getReport({
	auth,
	report,
	parameters,
	format = 'json',
}: {
	auth: WorkdayAuthValue;
	report: string;
	parameters?: WorkdayRecord;
	format?: 'json' | 'csv';
}): Promise<WorkdayReport> {
	const { owner, name, urlParameters } = parseReportReference({ auth, report });
	const reportPath = `${owner}/${name}`;
	const body = await workdayClient.report({
		auth,
		owner,
		name,
		query: { ...urlParameters, ...toPromptValues({ parameters }), format },
	});
	if (format === 'csv') {
		return { reportPath, format, csv: typeof body === 'string' ? body : '' };
	}
	return { reportPath, format, rows: readReportEntries({ body }) };
}

async function getSupplierInvoice({
	auth,
	invoiceId,
}: {
	auth: WorkdayAuthValue;
	invoiceId: string;
}): Promise<WorkdayRecord | undefined> {
	const idType = WID_PATTERN.test(invoiceId) ? 'WID' : 'Supplier_Invoice_Reference_ID';
	const operationXml = `
    <bsvc:Get_Supplier_Invoices_Request xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Request_References>
        <bsvc:Supplier_Invoice_Reference>
          <bsvc:ID bsvc:type="${idType}">${workdayUtils.escapeXml({ value: invoiceId })}</bsvc:ID>
        </bsvc:Supplier_Invoice_Reference>
      </bsvc:Request_References>
    </bsvc:Get_Supplier_Invoices_Request>`;

	const body = await workdayClient.soap<WorkdaySupplierInvoicesBody>({
		auth,
		service: 'Resource_Management',
		operationXml,
	});
	const invoice = body.Get_Supplier_Invoices_Response?.Response_Data?.Supplier_Invoice;
	return Array.isArray(invoice) ? invoice[0] : invoice;
}

async function approveTask({
	auth,
	taskId,
	comment,
}: {
	auth: WorkdayAuthValue;
	taskId: string;
	comment?: string;
}): Promise<WorkdayRecord> {
	let commentXml = '';
	if (comment) {
		commentXml = `
      <bsvc:Approve_Business_Process_Data>
        <bsvc:Comment>${workdayUtils.escapeXml({ value: comment })}</bsvc:Comment>
      </bsvc:Approve_Business_Process_Data>`;
	}

	const operationXml = `
    <bsvc:Approve_Business_Process_Request xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Event_Reference>
        <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({ value: taskId })}</bsvc:ID>
      </bsvc:Event_Reference>${commentXml}
    </bsvc:Approve_Business_Process_Request>`;

	return await workdayClient.soap({ auth, service: 'Integrations', operationXml });
}

async function changeJob({
	auth,
	workerId,
	effectiveDate,
	reasonId,
	jobProfileId,
	supervisoryOrganizationId,
	positionId,
}: {
	auth: WorkdayAuthValue;
	workerId: string;
	effectiveDate: string;
	reasonId: string;
	jobProfileId?: string;
	supervisoryOrganizationId?: string;
	positionId?: string;
}): Promise<WorkdayRecord> {
	let supervisoryOrgXml = '';
	if (supervisoryOrganizationId) {
		supervisoryOrgXml = `
          <bsvc:Supervisory_Organization_Reference>
            <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({
							value: supervisoryOrganizationId,
						})}</bsvc:ID>
          </bsvc:Supervisory_Organization_Reference>`;
	}

	let jobDetailsXml = '';
	if (jobProfileId) {
		jobDetailsXml = `
          <bsvc:Job_Details_Data>
            <bsvc:Job_Profile_Reference>
              <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({ value: jobProfileId })}</bsvc:ID>
            </bsvc:Job_Profile_Reference>
          </bsvc:Job_Details_Data>`;
	}

	let positionXml = '';
	if (positionId) {
		positionXml = `
        <bsvc:Position_Reference>
          <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({ value: positionId })}</bsvc:ID>
        </bsvc:Position_Reference>`;
	}

	const operationXml = `
    <bsvc:Change_Job_Request xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Business_Process_Parameters>
        <bsvc:Auto_Complete>true</bsvc:Auto_Complete>
        <bsvc:Run_Now>true</bsvc:Run_Now>
      </bsvc:Business_Process_Parameters>
      <bsvc:Change_Job_Data>
        <bsvc:Worker_Reference>
          <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({ value: workerId })}</bsvc:ID>
        </bsvc:Worker_Reference>${positionXml}
        <bsvc:Effective_Date>${workdayUtils.escapeXml({
					value: effectiveDate,
				})}</bsvc:Effective_Date>
        <bsvc:Change_Job_Detail_Data>
          <bsvc:Reason_Reference>
            <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({ value: reasonId })}</bsvc:ID>
          </bsvc:Reason_Reference>${supervisoryOrgXml}${jobDetailsXml}
        </bsvc:Change_Job_Detail_Data>
      </bsvc:Change_Job_Data>
    </bsvc:Change_Job_Request>`;

	return await workdayClient.soap({ auth, service: 'Staffing', operationXml });
}

async function createJobRequisition({
	auth,
	supervisoryOrganizationId,
	reasonId,
	jobPostingTitle,
	numberOfOpenings,
	jobProfileId,
	workerTypeId,
	workerSubTypeId,
	primaryLocationId,
	recruitingStartDate,
	targetHireDate,
}: {
	auth: WorkdayAuthValue;
	supervisoryOrganizationId: string;
	reasonId: string;
	jobPostingTitle: string;
	numberOfOpenings?: number;
	jobProfileId?: string;
	workerTypeId?: string;
	workerSubTypeId?: string;
	primaryLocationId?: string;
	recruitingStartDate: string;
	targetHireDate: string;
}): Promise<WorkdayRecord> {
	const openings = numberOfOpenings ?? 1;

	const recruitingStartDateXml = `
            <bsvc:Recruiting_Start_Date>${workdayUtils.escapeXml({
							value: recruitingStartDate,
						})}</bsvc:Recruiting_Start_Date>`;

	const targetHireDateXml = `
            <bsvc:Target_Hire_Date>${workdayUtils.escapeXml({
							value: targetHireDate,
						})}</bsvc:Target_Hire_Date>`;

	const jobProfileXml = jobProfileId
		? `
          <bsvc:Job_Profile_Reference>
            <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({ value: jobProfileId })}</bsvc:ID>
          </bsvc:Job_Profile_Reference>`
		: '';

	const primaryLocationXml = primaryLocationId
		? `
          <bsvc:Primary_Location_Reference>
            <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({
							value: primaryLocationId,
						})}</bsvc:ID>
          </bsvc:Primary_Location_Reference>
          <bsvc:Primary_Job_Posting_Location_Reference>
            <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({
							value: primaryLocationId,
						})}</bsvc:ID>
          </bsvc:Primary_Job_Posting_Location_Reference>`
		: '';

	const workerTypeXml = workerTypeId
		? `
          <bsvc:Worker_Type_Reference>
            <bsvc:ID bsvc:type="Worker_Type_ID">${workdayUtils.escapeXml({
							value: workerTypeId,
						})}</bsvc:ID>
          </bsvc:Worker_Type_Reference>`
		: '';

	const workerSubTypeXml = workerSubTypeId
		? `
          <bsvc:Worker_Sub-Type_Reference>
            <bsvc:ID bsvc:type="Employee_Type_ID">${workdayUtils.escapeXml({
							value: workerSubTypeId,
						})}</bsvc:ID>
          </bsvc:Worker_Sub-Type_Reference>`
		: '';

	const reasonIdKind = WID_PATTERN.test(reasonId) ? 'WID' : 'General_Event_Subcategory_ID';

	const operationXml = `
    <bsvc:Create_Requisition_Request xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Business_Process_Parameters>
        <bsvc:Auto_Complete>true</bsvc:Auto_Complete>
        <bsvc:Run_Now>true</bsvc:Run_Now>
      </bsvc:Business_Process_Parameters>
      <bsvc:Create_Job_Requisition_Data>
        <bsvc:Supervisory_Organization_Reference>
          <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({
						value: supervisoryOrganizationId,
					})}</bsvc:ID>
        </bsvc:Supervisory_Organization_Reference>
        <bsvc:Create_Job_Requisition_Reason_Reference>
          <bsvc:ID bsvc:type="${reasonIdKind}">${workdayUtils.escapeXml({
		value: reasonId,
	})}</bsvc:ID>
        </bsvc:Create_Job_Requisition_Reason_Reference>
        <bsvc:Number_of_Openings>${openings}</bsvc:Number_of_Openings>
        <bsvc:Job_Requisition_Data>
          <bsvc:Job_Posting_Title>${workdayUtils.escapeXml({
						value: jobPostingTitle,
					})}</bsvc:Job_Posting_Title>${recruitingStartDateXml}${targetHireDateXml}${jobProfileXml}${workerTypeXml}${workerSubTypeXml}${primaryLocationXml}
        </bsvc:Job_Requisition_Data>
      </bsvc:Create_Job_Requisition_Data>
    </bsvc:Create_Requisition_Request>`;

	return await workdayClient.soap({ auth, service: 'Recruiting', operationXml });
}

async function createPreHire({
	auth,
	firstName,
	lastName,
	email,
	phone,
	country,
}: {
	auth: WorkdayAuthValue;
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
	country: string;
}): Promise<WorkdayRecord> {
	let phoneXml = '';
	if (phone) {
		phoneXml = `
            <bsvc:Phone_Data>
              <bsvc:Country_ISO_Code>${workdayUtils.escapeXml({
								value: country,
							})}</bsvc:Country_ISO_Code>
              <bsvc:Phone_Number>${workdayUtils.escapeXml({ value: phone })}</bsvc:Phone_Number>
              <bsvc:Phone_Device_Type_Reference>
                <bsvc:ID bsvc:type="Phone_Device_Type_ID">Mobile</bsvc:ID>
              </bsvc:Phone_Device_Type_Reference>
              <bsvc:Usage_Data bsvc:Public="true">
                <bsvc:Type_Data bsvc:Primary="true">
                  <bsvc:Type_Reference>
                    <bsvc:ID bsvc:type="Communication_Usage_Type_ID">WORK</bsvc:ID>
                  </bsvc:Type_Reference>
                </bsvc:Type_Data>
              </bsvc:Usage_Data>
            </bsvc:Phone_Data>`;
	}

	const operationXml = `
    <bsvc:Put_Applicant_Request xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Applicant_Data>
        <bsvc:Personal_Data>
          <bsvc:Name_Data>
            <bsvc:Legal_Name_Data>
              <bsvc:Name_Detail_Data>
                <bsvc:Country_Reference>
                  <bsvc:ID bsvc:type="ISO_3166-1_Alpha-3_Code">${workdayUtils.escapeXml({
										value: country,
									})}</bsvc:ID>
                </bsvc:Country_Reference>
                <bsvc:First_Name>${workdayUtils.escapeXml({ value: firstName })}</bsvc:First_Name>
                <bsvc:Last_Name>${workdayUtils.escapeXml({ value: lastName })}</bsvc:Last_Name>
              </bsvc:Name_Detail_Data>
            </bsvc:Legal_Name_Data>
          </bsvc:Name_Data>
          <bsvc:Contact_Data>
            <bsvc:Email_Address_Data>
              <bsvc:Email_Address>${workdayUtils.escapeXml({ value: email })}</bsvc:Email_Address>
              <bsvc:Usage_Data bsvc:Public="true">
                <bsvc:Type_Data bsvc:Primary="true">
                  <bsvc:Type_Reference>
                    <bsvc:ID bsvc:type="Communication_Usage_Type_ID">WORK</bsvc:ID>
                  </bsvc:Type_Reference>
                </bsvc:Type_Data>
              </bsvc:Usage_Data>
            </bsvc:Email_Address_Data>${phoneXml}
          </bsvc:Contact_Data>
        </bsvc:Personal_Data>
      </bsvc:Applicant_Data>
    </bsvc:Put_Applicant_Request>`;

	return await workdayClient.soap({ auth, service: 'Staffing', operationXml });
}

async function createSupplierCreditMemo({
	auth,
	supplierId,
	memoDate,
	amount,
	description,
}: {
	auth: WorkdayAuthValue;
	supplierId: string;
	memoDate: string;
	amount: string;
	description?: string;
}): Promise<WorkdayRecord> {
	let memoXml = '';
	if (description) {
		memoXml = `
        <bsvc:Document_Memo>${workdayUtils.escapeXml({ value: description })}</bsvc:Document_Memo>`;
	}

	const operationXml = `
    <bsvc:Submit_Supplier_Invoice_Adjustment_Request xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Business_Process_Parameters>
        <bsvc:Auto_Complete>true</bsvc:Auto_Complete>
      </bsvc:Business_Process_Parameters>
      <bsvc:Supplier_Invoice_Adjustment_Data>
        <bsvc:Submit>true</bsvc:Submit>
        <bsvc:Supplier_Reference>
          <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({ value: supplierId })}</bsvc:ID>
        </bsvc:Supplier_Reference>
        <bsvc:Adjustment_Date>${workdayUtils.escapeXml({ value: memoDate })}</bsvc:Adjustment_Date>
        <bsvc:Control_Total_Amount>${workdayUtils.escapeXml({
					value: amount,
				})}</bsvc:Control_Total_Amount>${memoXml}
      </bsvc:Supplier_Invoice_Adjustment_Data>
    </bsvc:Submit_Supplier_Invoice_Adjustment_Request>`;

	return await workdayClient.soap({ auth, service: 'Resource_Management', operationXml });
}

async function createTimeOffRequest({
	auth,
	workerId,
	timeOffTypeId,
	startDate,
	endDate,
	comment,
	hoursPerDay,
}: {
	auth: WorkdayAuthValue;
	workerId: string;
	timeOffTypeId: string;
	startDate: string;
	endDate: string;
	comment?: string;
	hoursPerDay?: number;
}): Promise<WorkdayRecord> {
	const typeIdKind = WID_PATTERN.test(timeOffTypeId) ? 'WID' : 'Time_Off_Type_ID';
	const requested = hoursPerDay ?? 8;
	const start = parseIsoDate({ value: startDate, label: 'Start Date' });
	const end = parseIsoDate({ value: endDate, label: 'End Date' });
	if (end < start) {
		throw new Error('End Date must be on or after Start Date.');
	}
	let entriesXml = '';
	const current = new Date(start);
	while (current <= end) {
		const isWeekend = current.getUTCDay() === 0 || current.getUTCDay() === 6;
		if (!isWeekend) {
			const dateStr = current.toISOString().split('T')[0];
			entriesXml += `
          <bsvc:Enter_Time_Off_Entry_Data>
            <bsvc:Date>${dateStr}</bsvc:Date>
            <bsvc:Requested>${requested}</bsvc:Requested>
            <bsvc:Time_Off_Type_Reference>
              <bsvc:ID bsvc:type="${typeIdKind}">${workdayUtils.escapeXml({
				value: timeOffTypeId,
			})}</bsvc:ID>
            </bsvc:Time_Off_Type_Reference>${
							comment
								? `\n            <bsvc:Comment>${workdayUtils.escapeXml({
										value: comment,
								  })}</bsvc:Comment>`
								: ''
						}
          </bsvc:Enter_Time_Off_Entry_Data>`;
		}
		current.setUTCDate(current.getUTCDate() + 1);
	}
	if (entriesXml === '') {
		throw new Error('The date range has no weekdays to request time off for.');
	}

	const operationXml = `
    <bsvc:Enter_Time_Off_Request xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Business_Process_Parameters>
        <bsvc:Auto_Complete>true</bsvc:Auto_Complete>
        <bsvc:Run_Now>true</bsvc:Run_Now>
      </bsvc:Business_Process_Parameters>
      <bsvc:Enter_Time_Off_Data>
        <bsvc:Worker_Reference>
          <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({ value: workerId })}</bsvc:ID>
        </bsvc:Worker_Reference>${entriesXml}
      </bsvc:Enter_Time_Off_Data>
    </bsvc:Enter_Time_Off_Request>`;

	return await workdayClient.soap({ auth, service: 'Absence_Management', operationXml });
}

async function createWorkerTimeBlock({
	auth,
	workerId,
	date,
	hours,
	timeTypeId,
	comment,
}: {
	auth: WorkdayAuthValue;
	workerId: string;
	date: string;
	hours: number;
	timeTypeId?: string;
	comment?: string;
}): Promise<WorkdayRecord> {
	let timeEntryCodeXml = '';
	if (timeTypeId) {
		timeEntryCodeXml = `
          <bsvc:Time_Entry_Code_Reference>
            <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({ value: timeTypeId })}</bsvc:ID>
          </bsvc:Time_Entry_Code_Reference>`;
	}

	let commentXml = '';
	if (comment) {
		commentXml = `
          <bsvc:Comment>${workdayUtils.escapeXml({ value: comment })}</bsvc:Comment>`;
	}

	const operationXml = `
    <bsvc:Put_Reported_Time_Blocks_for_Worker_Request xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Reported_Time_Block_Data>
        <bsvc:Worker_Reference>
          <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({ value: workerId })}</bsvc:ID>
        </bsvc:Worker_Reference>
        <bsvc:Date>${workdayUtils.escapeXml({ value: date })}</bsvc:Date>
        <bsvc:Quantity>${hours}</bsvc:Quantity>${timeEntryCodeXml}${commentXml}
      </bsvc:Reported_Time_Block_Data>
    </bsvc:Put_Reported_Time_Blocks_for_Worker_Request>`;

	return await workdayClient.soap({ auth, service: 'Time_Tracking', operationXml });
}

async function hireEmployee({
	auth,
	applicantId,
	hireDate,
	positionId,
	supervisoryOrganizationId,
	jobProfileId,
	hireReasonId,
	employeeTypeId,
}: {
	auth: WorkdayAuthValue;
	applicantId: string;
	hireDate: string;
	positionId?: string;
	supervisoryOrganizationId?: string;
	jobProfileId?: string;
	hireReasonId: string;
	employeeTypeId: string;
}): Promise<WorkdayRecord> {
	let positionXml = '';
	if (positionId) {
		positionXml = `
        <bsvc:Position_Reference>
          <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({ value: positionId })}</bsvc:ID>
        </bsvc:Position_Reference>`;
	}

	const organizationXml = supervisoryOrganizationId
		? `
        <bsvc:Organization_Reference>
          <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({
						value: supervisoryOrganizationId,
					})}</bsvc:ID>
        </bsvc:Organization_Reference>`
		: '';

	const jobProfileXml = jobProfileId
		? `
            <bsvc:Job_Profile_Reference>
              <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({ value: jobProfileId })}</bsvc:ID>
            </bsvc:Job_Profile_Reference>`
		: '';

	const operationXml = `
    <bsvc:Hire_Employee_Request xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Business_Process_Parameters>
        <bsvc:Auto_Complete>true</bsvc:Auto_Complete>
        <bsvc:Run_Now>true</bsvc:Run_Now>
      </bsvc:Business_Process_Parameters>
      <bsvc:Hire_Employee_Data>
        <bsvc:Applicant_Reference>
          <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({ value: applicantId })}</bsvc:ID>
        </bsvc:Applicant_Reference>${organizationXml}${positionXml}
        <bsvc:Hire_Date>${workdayUtils.escapeXml({ value: hireDate })}</bsvc:Hire_Date>
        <bsvc:Hire_Employee_Event_Data>
          <bsvc:Hire_Reason_Reference>
            <bsvc:ID bsvc:type="General_Event_Subcategory_ID">${workdayUtils.escapeXml({
							value: hireReasonId,
						})}</bsvc:ID>
          </bsvc:Hire_Reason_Reference>
          <bsvc:Employee_Type_Reference>
            <bsvc:ID bsvc:type="Employee_Type_ID">${workdayUtils.escapeXml({
							value: employeeTypeId,
						})}</bsvc:ID>
          </bsvc:Employee_Type_Reference>
          <bsvc:First_Day_of_Work>${workdayUtils.escapeXml({
						value: hireDate,
					})}</bsvc:First_Day_of_Work>
          <bsvc:Position_Details>${jobProfileXml}
          </bsvc:Position_Details>
        </bsvc:Hire_Employee_Event_Data>
      </bsvc:Hire_Employee_Data>
    </bsvc:Hire_Employee_Request>`;

	return await workdayClient.soap({ auth, service: 'Staffing', operationXml });
}

async function updateSupplier({
	auth,
	supplierId,
	supplierName,
	taxId,
	taxIdType,
	paymentTermsId,
}: {
	auth: WorkdayAuthValue;
	supplierId: string;
	supplierName?: string;
	taxId?: string;
	taxIdType?: string;
	paymentTermsId?: string;
}): Promise<WorkdayRecord> {
	if (Boolean(taxId) !== Boolean(taxIdType)) {
		throw new Error('Tax ID and Tax ID Type must be set together, e.g. Tax ID Type `USA-EIN`.');
	}
	let supplierDataFields = '';
	if (supplierName) {
		supplierDataFields += `
        <bsvc:Supplier_Name>${workdayUtils.escapeXml({
					value: supplierName,
				})}</bsvc:Supplier_Name>`;
	}
	if (taxId && taxIdType) {
		supplierDataFields += `
        <bsvc:Tax_ID_Widget_Data bsvc:Replace_All="false">
          <bsvc:Tax_ID_Data>
            <bsvc:Tax_ID_Text>${workdayUtils.escapeXml({ value: taxId })}</bsvc:Tax_ID_Text>
            <bsvc:Tax_ID_Type_Reference>
              <bsvc:ID bsvc:type="Tax_ID_Type">${workdayUtils.escapeXml({
								value: taxIdType,
							})}</bsvc:ID>
            </bsvc:Tax_ID_Type_Reference>
          </bsvc:Tax_ID_Data>
        </bsvc:Tax_ID_Widget_Data>`;
	}
	if (paymentTermsId) {
		supplierDataFields += `
        <bsvc:Payment_Terms_Reference>
          <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({ value: paymentTermsId })}</bsvc:ID>
        </bsvc:Payment_Terms_Reference>`;
	}

	const operationXml = `
    <bsvc:Submit_Supplier_Request xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Supplier_Reference>
        <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({ value: supplierId })}</bsvc:ID>
      </bsvc:Supplier_Reference>
      <bsvc:Supplier_Data>${supplierDataFields}
      </bsvc:Supplier_Data>
    </bsvc:Submit_Supplier_Request>`;

	return await workdayClient.soap({ auth, service: 'Resource_Management', operationXml });
}

async function updateSupplierInvoice({
	auth,
	invoiceId,
	invoiceDate,
	invoiceNumber,
	total,
}: {
	auth: WorkdayAuthValue;
	invoiceId: string;
	invoiceDate?: string;
	invoiceNumber?: string;
	total?: string;
}): Promise<WorkdayRecord> {
	let invoiceDataFields = '';
	if (invoiceNumber) {
		invoiceDataFields += `
        <bsvc:Invoice_Number>${workdayUtils.escapeXml({
					value: invoiceNumber,
				})}</bsvc:Invoice_Number>`;
	}
	if (invoiceDate) {
		invoiceDataFields += `
        <bsvc:Invoice_Date>${workdayUtils.escapeXml({ value: invoiceDate })}</bsvc:Invoice_Date>`;
	}
	if (total) {
		invoiceDataFields += `
        <bsvc:Control_Amount_Total>${workdayUtils.escapeXml({
					value: total,
				})}</bsvc:Control_Amount_Total>`;
	}

	const operationXml = `
    <bsvc:Submit_Supplier_Invoice_Request xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Supplier_Invoice_Reference>
        <bsvc:ID bsvc:type="WID">${workdayUtils.escapeXml({ value: invoiceId })}</bsvc:ID>
      </bsvc:Supplier_Invoice_Reference>
      <bsvc:Supplier_Invoice_Data>${invoiceDataFields}
      </bsvc:Supplier_Invoice_Data>
    </bsvc:Submit_Supplier_Invoice_Request>`;

	return await workdayClient.soap({ auth, service: 'Resource_Management', operationXml });
}

function parseIsoDate({ value, label }: { value: string; label: string }): Date {
	const trimmed = value.trim();
	const date = new Date(`${trimmed}T00:00:00.000Z`);
	if (
		!/^\d{4}-\d{2}-\d{2}$/.test(trimmed) ||
		Number.isNaN(date.getTime()) ||
		date.toISOString().slice(0, 10) !== trimmed
	) {
		throw new Error(`${label} must be a date in YYYY-MM-DD format, e.g. 2026-11-03.`);
	}
	return date;
}

function escapeWql({ value }: { value: string }): string {
	return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function parseReportReference({ auth, report }: { auth: WorkdayAuthValue; report: string }): {
	owner: string;
	name: string;
	urlParameters: Record<string, string>;
} {
	const value = report.trim();
	if (!/^https?:\/\//i.test(value)) {
		const parts = value.split('/');
		if (parts.length !== 2 || !parts[0] || !parts[1]) {
			throw new Error(
				'Enter the report as `owner/report_name` (e.g. `lmcneil/PT_Workers`) or paste its RaaS URL.',
			);
		}
		return { owner: parts[0], name: parts[1], urlParameters: {} };
	}
	const url = new URL(value);
	const host = workdayClient.apiHost({ auth });
	if (url.hostname.toLowerCase() !== host.toLowerCase()) {
		throw new Error(
			`The report URL host "${url.hostname}" does not match the connection's API host "${host}".`,
		);
	}
	const match = /^\/ccx\/service\/customreport2\/([^/]+)\/([^/]+)\/([^/]+)\/?$/.exec(url.pathname);
	if (!match) {
		throw new Error(
			'The URL is not a Workday RaaS URL (expected /ccx/service/customreport2/{tenant}/{owner}/{report}).',
		);
	}
	const tenant = workdayClient.tenant({ auth });
	if (decodeURIComponent(match[1]) !== tenant) {
		throw new Error(
			`The report URL tenant "${decodeURIComponent(
				match[1],
			)}" does not match the connection's tenant "${tenant}".`,
		);
	}
	const urlParameters = Object.fromEntries(
		[...url.searchParams.entries()].filter(([key]) => key !== 'format'),
	);
	return {
		owner: decodeURIComponent(match[2]),
		name: decodeURIComponent(match[3]),
		urlParameters,
	};
}

function toPromptValues({
	parameters,
}: {
	parameters: WorkdayRecord | undefined;
}): Record<string, string> {
	if (!parameters) {
		return {};
	}
	return Object.fromEntries(
		Object.entries(parameters)
			.filter(([, value]) => value !== undefined && value !== null)
			.map(([key, value]) => [
				key,
				Array.isArray(value) ? value.map(String).join('!') : String(value),
			]),
	);
}

function readReportEntries({ body }: { body: unknown }): WorkdayRecord[] {
	if (typeof body !== 'object' || body === null || !('Report_Entry' in body)) {
		return [];
	}
	const entries = body.Report_Entry;
	const list = Array.isArray(entries) ? entries : [entries];
	return list.filter(
		(entry): entry is WorkdayRecord => typeof entry === 'object' && entry !== null,
	);
}

export const workdayApi = {
	getServerTimestamp,
	listCustomObjectDefinitions,
	getCustomObject,
	upsertCustomObject,
	getBusinessObject,
	searchBusinessObjects,
	listBusinessObjects,
	listSoapObjects,
	listChangedSoapObjects,
	updateBusinessObject,
	callRestOperation,
	callSoapOperation,
	runWql,
	runWqlAll,
	findSupplier,
	findPurchaseOrder,
	findSupplierPayments,
	listInboxTasks,
	listTerminations,
	listNewHires,
	listBusinessProcessTransactions,
	getReport,
	getSupplierInvoice,
	approveTask,
	changeJob,
	createJobRequisition,
	createPreHire,
	createSupplierCreditMemo,
	createTimeOffRequest,
	createWorkerTimeBlock,
	hireEmployee,
	updateSupplier,
	updateSupplierInvoice,
};

const WID_PATTERN = /^[0-9a-f]{32}$/i;
const SOAP_PAGE_SIZE = 100;
